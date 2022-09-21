import { promises as fs } from 'fs'
import { dirname, resolve } from 'path'
import type { PreparserExtensionLoader, SlideInfo, SlideInfoWithPath, SlidevMarkdown, SlidevPreparserExtension, SlidevThemeMeta } from '@slidev/types'
import { detectFeatures, mergeFeatureFlags, parse, stringify, stringifySlide } from './core'
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
    return [
      ...exts,
      ...preparserExtensionLoader ? await preparserExtensionLoader(headmatter.addons ?? [], filepath) : [],
    ]
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

    data.slides.splice(iSlide, 1)

    const srcExpression = baseSlide.frontmatter.src
    const path = resolve(dir, srcExpression)
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

      data.features = mergeFeatureFlags(data.features, detectFeatures(raw))
      entries.add(path)
      data.slides.splice(iSlide + offset, 0, slide)
    }
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

export async function saveExternalSlide(slide: SlideInfoWithPath) {
  await fs.writeFile(slide.filepath, stringifySlide(slide), 'utf-8')
}
