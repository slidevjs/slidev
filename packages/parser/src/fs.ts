import { existsSync, promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { LoadedSnippets, PreparserExtensionLoader, SlideInfo, SlideInfoWithPath, SlidevMarkdown, SlidevPreparserExtension, SlidevThemeMeta } from '@slidev/types'
import { detectFeatures, mergeFeatureFlags, parse, parseRangeString, stringify, stringifySlide } from './core'

export * from './core'

let preparserExtensionLoader: PreparserExtensionLoader | null = null

export function injectPreparserExtensionLoader(fn: PreparserExtensionLoader) {
  preparserExtensionLoader = fn
}

export async function loadExternalSnippets(slide: SlideInfo, snippets: LoadedSnippets, dir: string, entries: Set<string>) {
  for (const match of slide.content.matchAll(/^```(\w+?)\s*\[([\s\S]+?)\]([\s\S]*?)\n+^```/mg)) {
    const [_full, _lang, external] = match

    if (snippets[external] !== undefined)
      continue

    const [externalPath, externalRangeStr] = external.split(':').map(i => i.trim())

    let sourcePath: string
    if (externalPath.startsWith('/'))
      sourcePath = resolve(dir, externalPath.substring(1))
    else if (slide.source?.filepath)
      sourcePath = resolve(dirname(slide.source.filepath), externalPath)
    else
      sourcePath = resolve(dir, externalPath)

    entries.add(sourcePath)
    let source: string
    if (!existsSync(sourcePath))
      source = `File not found: ${sourcePath}`
    try {
      source = await fs.readFile(sourcePath, 'utf-8')
    }
    catch (e) {
      source = `Error reading file: ${sourcePath}\n\n${e}`
    }

    if (externalRangeStr) {
      const lines = source.split(/\r?\n/g)
      source = parseRangeString(lines.length, externalRangeStr).map(i => lines[i - 1]).join('\n')
    }
    snippets[external] = source
    slide.snippetsUsed.push(external)
  }
}

export async function load(filepath: string, themeMeta?: SlidevThemeMeta, content?: string) {
  const dir = dirname(filepath)
  const markdown = content ?? await fs.readFile(filepath, 'utf-8')

  const preparserExtensions: SlidevPreparserExtension[] = []
  const data = await parse(markdown, filepath, themeMeta, [], async (headmatter, exts: SlidevPreparserExtension[], filepath: string | undefined) => {
    preparserExtensions.splice(
      0,
      preparserExtensions.length,
      ...exts,
      ...preparserExtensionLoader ? await preparserExtensionLoader(headmatter, filepath) : [],
    )
    return preparserExtensions
  })

  const entries = new Set([
    filepath,
  ])
  const snippets: LoadedSnippets = {}

  for (let iSlide = 0; iSlide < data.slides.length;) {
    const baseSlide = data.slides[iSlide]
    if (!baseSlide.frontmatter.src) {
      iSlide++
      await loadExternalSnippets(baseSlide, snippets, dir, entries)
      continue
    }

    data.slides.splice(iSlide, 1)

    if (baseSlide.frontmatter.hide)
      continue

    const srcExpression = baseSlide.frontmatter.src
    let path
    if (srcExpression.startsWith('/'))
      path = resolve(dir, srcExpression.substring(1))
    else if (baseSlide.source?.filepath)
      path = resolve(dirname(baseSlide.source.filepath), srcExpression)
    else
      path = resolve(dir, srcExpression)

    const raw = await fs.readFile(path, 'utf-8')
    const subSlides = await parse(raw, path, themeMeta, preparserExtensions)

    for (const [offset, subSlide] of subSlides.slides.entries()) {
      const slide: SlideInfo = { ...baseSlide }

      slide.source = {
        filepath: path,
        ...subSlide,
      }

      if (offset === 0 && !baseSlide.frontmatter.srcSequence) {
        slide.inline = { ...baseSlide }
        delete slide.inline.frontmatter.src
        Object.assign(slide, slide.source, { raw: null })
      }
      else {
        Object.assign(slide, slide.source)
      }

      const baseSlideFrontMatterWithoutSrc = { ...baseSlide.frontmatter }
      delete baseSlideFrontMatterWithoutSrc.src

      slide.frontmatter = {
        ...subSlide.frontmatter,
        ...baseSlideFrontMatterWithoutSrc,
        srcSequence: `${baseSlide.frontmatter.srcSequence ? `${baseSlide.frontmatter.srcSequence},` : ''}${srcExpression}`,
      }

      await loadExternalSnippets(slide, snippets, dir, entries)

      data.features = mergeFeatureFlags(data.features, detectFeatures(raw))
      entries.add(path)
      data.slides.splice(iSlide + offset, 0, slide)
    }
  }
  // re-index slides
  for (let iSlide = 0; iSlide < data.slides.length; iSlide++)
    data.slides[iSlide].index = iSlide === 0 ? 0 : 1 + data.slides[iSlide - 1].index

  data.entries = Array.from(entries)
  data.snippets = snippets

  return data
}

export async function save(data: SlidevMarkdown, filepath?: string) {
  filepath = filepath || data.filepath!

  await fs.writeFile(filepath, stringify(data), 'utf-8')
}

export async function saveExternalSlide(slide: SlideInfoWithPath) {
  await fs.writeFile(slide.filepath, stringifySlide(slide), 'utf-8')
}
