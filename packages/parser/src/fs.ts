import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import YAML from 'js-yaml'
import { slash } from '@antfu/utils'
import type { PreparserExtensionLoader, SlideInfo, SlidevData, SlidevMarkdown, SlidevPreparserExtension, SourceSlideInfo } from '@slidev/types'
import { detectFeatures, parse, parseRangeString, stringify } from './core'

export * from './core'

let preparserExtensionLoader: PreparserExtensionLoader | null = null

export function injectPreparserExtensionLoader(fn: PreparserExtensionLoader) {
  preparserExtensionLoader = fn
}

/**
 * Slidev data without config and themeMeta,
 * because config and themeMeta depends on the theme to be loaded.
 */
export type LoadedSlidevData = Omit<SlidevData, 'config' | 'themeMeta'>

export async function load(userRoot: string, filepath: string, content?: string, mode?: string): Promise<LoadedSlidevData> {
  const markdown = content ?? await fs.readFile(filepath, 'utf-8')

  let extensions: SlidevPreparserExtension[] | undefined
  if (preparserExtensionLoader) {
    // #703
    // identify the headmatter, to be able to load preparser extensions
    // (strict parsing based on the parsing code)
    const lines = markdown.split(/\r?\n/g)
    let hm = ''
    if (lines[0].match(/^---([^-].*)?$/) && !lines[1]?.match(/^\s*$/)) {
      let hEnd = 1
      while (hEnd < lines.length && !lines[hEnd].trimEnd().match(/^---$/))
        hEnd++
      hm = lines.slice(1, hEnd).join('\n')
    }
    const o = YAML.load(hm) as Record<string, unknown> ?? {}
    extensions = await preparserExtensionLoader(o, filepath, mode)
  }

  const markdownFiles: Record<string, SlidevMarkdown> = {}
  const slides: SlideInfo[] = []

  async function loadMarkdown(path: string, range?: string, frontmatterOverride?: Record<string, unknown>) {
    let md = markdownFiles[path]
    if (!md) {
      const raw = await fs.readFile(path, 'utf-8')
      md = await parse(raw, path, extensions)
      markdownFiles[path] = md
    }

    for (const index of parseRangeString(md.slides.length, range))
      await loadSlide(md.slides[index - 1], frontmatterOverride)

    return md
  }

  async function loadSlide(slide: SourceSlideInfo, frontmatterOverride?: Record<string, unknown>) {
    if (slide.frontmatter.disabled || slide.frontmatter.hide)
      return
    if (slide.frontmatter.src) {
      const [rawPath, rangeRaw] = slide.frontmatter.src.split('#')
      const path = rawPath.startsWith('/')
        ? resolve(userRoot, rawPath.substring(1))
        : resolve(dirname(slide.filepath), rawPath)

      frontmatterOverride = {
        ...slide.frontmatter,
        ...frontmatterOverride,
      }
      delete frontmatterOverride.src

      await loadMarkdown(path, rangeRaw, frontmatterOverride)
    }
    else {
      slides.push({
        index: slides.length,
        source: slide,
        frontmatter: { ...slide.frontmatter, ...frontmatterOverride },
        content: slide.content,
        note: slide.note,
        title: slide.title,
        level: slide.level,
      })
    }
  }

  const entry = await loadMarkdown(filepath)

  const headmatter = {
    title: slides[0]?.title,
    ...entry.slides[0]?.frontmatter,
  }

  return {
    slides,
    entry,
    headmatter,
    features: detectFeatures(slides.map(s => s.source.raw).join('')),
    markdownFiles,
    watchFiles: Object.keys(markdownFiles).map(slash),
  }
}

export async function save(markdown: SlidevMarkdown) {
  await fs.writeFile(markdown.filepath, stringify(markdown), 'utf-8')
}
