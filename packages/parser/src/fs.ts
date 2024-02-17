import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { PreparserExtensionLoader, SlideInfo, SlidevMarkdown, SlidevMarkdownWithPath, SlidevPreparserExtension, SlidevThemeMeta } from '@slidev/types'
import { detectFeatures, mergeFeatureFlags, parse, parseRangeString, stringify } from './core'

export * from './core'

let preparserExtensionLoader: PreparserExtensionLoader | null = null

export function injectPreparserExtensionLoader(fn: PreparserExtensionLoader) {
  preparserExtensionLoader = fn
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

  for (let iSlide = 0; iSlide < data.slides.length;) {
    const baseSlide = data.slides[iSlide]
    if (!baseSlide.frontmatter.src) {
      iSlide++
      continue
    }

    if (baseSlide.frontmatter.hide)
      continue

    const [pathRaw, rangeRaw] = baseSlide.frontmatter.src.split('#')
    let path: string
    if (pathRaw.startsWith('/'))
      path = resolve(dir, pathRaw.substring(1))
    else if (baseSlide.source?.filepath)
      path = resolve(dirname(baseSlide.source.filepath), pathRaw)
    else
      path = resolve(dir, pathRaw)

    let subSlidesData = data.subSlides?.[path]
    if (!subSlidesData) {
      entries.add(path)
      const raw = await fs.readFile(path, 'utf-8')
      subSlidesData = await parse(raw, path, themeMeta, preparserExtensions) as SlidevMarkdownWithPath
      subSlidesData.slides.forEach(s => s.filepath = path)
      data.subSlides ??= {}
      data.subSlides[path] = subSlidesData
    }

    let subSlides = subSlidesData.slides
    let features = subSlidesData.features
    if (rangeRaw) {
      const range = parseRangeString(subSlides.length, rangeRaw)
      subSlides = range.map(i => subSlides[i - 1])
      const rawInRange = subSlides.map(s => s.raw).join('')
      features = detectFeatures(rawInRange)
    }

    data.features = mergeFeatureFlags(data.features, features)

    data.slides.splice(iSlide, 1, ...subSlides.map((subSlide, offset) => {
      const slide: SlideInfo = {
        ...baseSlide,
        source: subSlide,
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
        srcSequence: `${baseSlide.frontmatter.srcSequence ? `${baseSlide.frontmatter.srcSequence},` : ''}${pathRaw}`,
      }

      return slide
    }))
  }

  // re-index slides
  for (let iSlide = 0; iSlide < data.slides.length; iSlide++)
    data.slides[iSlide].index = iSlide === 0 ? 0 : 1 + data.slides[iSlide - 1].index

  data.entries = Array.from(entries)

  return data
}

export async function save(data: SlidevMarkdown, filepath?: string) {
  filepath = filepath || data.filepath!

  await fs.writeFile(filepath, stringify(data), 'utf-8')
}

export async function saveExternalSlide(data: SlidevMarkdown, filepath: string) {
  await fs.writeFile(filepath, stringify(data.subSlides![filepath]), 'utf-8')
}
