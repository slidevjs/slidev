import type {
  PreparserExtensionLoader,
  SlideInfo,
  SlidevData,
  SlidevMarkdown,
  SlidevPreparserExtension,
  SourceSlideInfo,
} from '@slidev/types'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { slash, uniq } from '@antfu/utils'
import { dirname, isAbsolute, relative, resolve } from 'pathe'
import YAML from 'yaml'
import { detectFeatures, parse, parseRangeString, stringify } from './core'

/**
 * Whether `filePath` resolves inside any of `roots` (no `..` escape).
 * Inlined here (rather than imported from the `slidev` package) because
 * `@slidev/parser` must stay independent of `@slidev/slidev`.
 */
export function isPathInsideRoots(filePath: string, roots: string[]): boolean {
  return roots.some((root) => {
    const rel = relative(root, filePath)
    return rel === '' || (!!rel && !rel.startsWith('..') && !isAbsolute(rel))
  })
}

const RE_FRONTMATTER_START = /^﻿?---(?:[^-].*)?$/
const RE_BLANK_LINE = /^\s*$/
const RE_FRONTMATTER_END = /^---$/
const RE_CRLF = /\r?\n/g

export * from './core'

let preparserExtensionLoader: PreparserExtensionLoader | null = null

export function injectPreparserExtensionLoader(fn: PreparserExtensionLoader) {
  preparserExtensionLoader = fn
}

export interface LoadRootsInfo {
  roots: string[]
  userRoot: string
  /**
   * When provided, `src:` includes resolving outside these roots are
   * rejected (recorded as an error) instead of being loaded. Optional for
   * backward compatibility with other `@slidev/parser` consumers.
   */
  allowedRoots?: string[]
}

/**
 * Slidev data without config and themeMeta,
 * because config and themeMeta depends on the theme to be loaded.
 */
export type LoadedSlidevData = Omit<SlidevData, 'config' | 'themeMeta'>

/**
 * Numbers in a `src:` range that point at no slide, such as `0` in `#0,2` or
 * `1.5` in `#1.5`. `parseRangeString` skips those fragments, so they are read
 * here as plain numbers to keep reporting them as missing slides.
 */
function findMissingSlideIndexes(total: number, range?: string) {
  const missing: number[] = []
  if (!range)
    return missing
  for (const part of range.split(/[,;]/g)) {
    const [start, end] = part.split('-', 2)
    const stop = !part.includes('-')
      ? +start + 1
      : end
        ? +end + 1
        : total + 1
    for (let index = +start; index < stop && index <= total; index++) {
      if (!Number.isInteger(index) || index < 1)
        missing.push(index)
    }
  }
  return missing
}

export async function load(
  options: LoadRootsInfo,
  filepath: string,
  sources: Record<string, string> | ((path: string) => Promise<string>) = {},
  mode?: string,
): Promise<LoadedSlidevData> {
  const loadSource = typeof sources === 'function'
    ? sources
    : async (path: string) => sources[path] ?? readFile(path, 'utf-8')

  const markdown = await loadSource(filepath)

  let extensions: SlidevPreparserExtension[] | undefined
  if (preparserExtensionLoader) {
    // #703
    // identify the headmatter, to be able to load preparser extensions
    // (strict parsing based on the parsing code)
    const lines = markdown.split(RE_CRLF)
    let hm = ''
    if (RE_FRONTMATTER_START.test(lines[0]) && !lines[1]?.match(RE_BLANK_LINE)) {
      let hEnd = 1
      while (hEnd < lines.length && !RE_FRONTMATTER_END.test(lines[hEnd].trimEnd()))
        hEnd++
      hm = lines.slice(1, hEnd).join('\n')
    }
    const o = YAML.parse(hm) as Record<string, unknown> ?? {}
    extensions = await preparserExtensionLoader(options.roots, o, filepath, mode)
  }

  const markdownFiles: Record<string, SlidevMarkdown> = {}
  const watchFiles: Record<string, Set<number>> = {}
  const slides: SlideInfo[] = []

  async function loadMarkdown(path: string, range?: string, frontmatterOverride?: Record<string, unknown>, importers?: SourceSlideInfo[]) {
    let md = markdownFiles[path]
    if (!md) {
      const raw = await loadSource(path)
      md = await parse(raw, path, extensions)
      markdownFiles[path] = md
      watchFiles[path] = new Set()
    }

    const directImporter = importers?.at(-1)
    const indexes = uniq([
      ...parseRangeString(md.slides.length, range),
      ...findMissingSlideIndexes(md.slides.length, range),
    ]).sort((a, b) => a - b)
    for (const index of indexes) {
      const subSlide = md.slides[index - 1]
      if (!subSlide) {
        // Only indexes from `findMissingSlideIndexes`, such as `#0` or `#1.5`,
        // reach here without a slide.
        md.errors ??= []
        md.errors.push({
          row: 0,
          message: `Slide ${index} does not exist in "${path}", which has ${md.slides.length} slides`,
        })
        continue
      }
      try {
        await loadSlide(md, subSlide, frontmatterOverride, importers)
      }
      catch (e) {
        md.errors ??= []
        md.errors.push({
          row: subSlide.start,
          message: `Error when loading slide: ${e}`,
        })
        continue
      }
      if (directImporter)
        (directImporter.imports ??= []).push(subSlide)
    }

    return md
  }

  async function loadSlide(md: SlidevMarkdown, slide: SourceSlideInfo, frontmatterOverride?: Record<string, unknown>, importChain?: SourceSlideInfo[]) {
    if (slide.frontmatter.disabled || slide.frontmatter.hide)
      return
    if (slide.frontmatter.src) {
      const [rawPath, rangeRaw] = slide.frontmatter.src.split('#')
      const path = slash(
        rawPath.startsWith('/')
          ? resolve(options.userRoot, rawPath.substring(1))
          : resolve(dirname(slide.filepath), rawPath),
      )

      frontmatterOverride = {
        ...slide.frontmatter,
        ...frontmatterOverride,
      }
      delete frontmatterOverride.src

      const ancestorPaths = new Set((importChain ?? []).map(s => s.filepath))
      if (path === slide.filepath || ancestorPaths.has(path)) {
        md.errors ??= []
        md.errors.push({
          row: slide.start,
          message: `Circular import detected for "${slide.frontmatter.src}" (${path})`,
        })
        return
      }

      if (options.allowedRoots && !isPathInsideRoots(path, options.allowedRoots)) {
        md.errors ??= []
        md.errors.push({
          row: slide.start,
          message: `Imported markdown escapes the project root: ${path}`,
        })
      }
      else if (!existsSync(path)) {
        md.errors ??= []
        md.errors.push({
          row: slide.start,
          message: `Imported markdown file not found: ${path}`,
        })
      }
      else {
        await loadMarkdown(path, rangeRaw, frontmatterOverride, importChain
          ? [...importChain, slide]
          : [slide])
      }
    }
    else {
      slides.push({
        frontmatter: {
          ...slide.frontmatter,
          ...frontmatterOverride,
        },
        content: slide.content,
        revision: slide.revision,
        frontmatterRaw: slide.frontmatterRaw,
        note: slide.note,
        title: slide.title,
        level: slide.level,
        index: slides.length,
        importChain,
        source: slide,
      })
    }
  }

  const entry = await loadMarkdown(slash(filepath))

  const headmatter = { ...entry.slides[0]?.frontmatter }
  if (slides[0]?.title)
    headmatter.title ??= slides[0].title

  return {
    slides,
    entry,
    headmatter,
    features: detectFeatures(slides.map(s => s.source.raw).join('')),
    markdownFiles,
    watchFiles,
  }
}

export async function save(markdown: SlidevMarkdown) {
  const fileContent = stringify(markdown)
  await writeFile(markdown.filepath, fileContent, 'utf-8')
  return fileContent
}
