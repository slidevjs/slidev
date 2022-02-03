import { promises as fs } from 'fs'
import { dirname, resolve } from 'path'
import type { SlideInfoWithPath, SlidevMarkdown, SlidevThemeMeta } from '@slidev/types'
import Markdown from 'markdown-it'
import { detectFeatures, mergeFeatureFlags, parse, parseSlide, stringify, stringifySlide } from './core'
export * from './core'

const md = Markdown({ html: true })

export async function load(filepath: string, themeMeta?: SlidevThemeMeta, content?: string) {
  const dir = dirname(filepath)
  const markdown = content ?? await fs.readFile(filepath, 'utf-8')

  const data = parse(markdown, filepath, themeMeta)

  const entries = new Set([
    filepath,
  ])

  for (const slide of data.slides) {
    if (slide.title)
      slide.title = md.render(slide.title).trim().replace(/^<p>/, '').replace(/<\/p>$/, '')

    if (!slide.frontmatter.src)
      continue

    const path = resolve(dir, slide.frontmatter.src)
    const raw = await fs.readFile(path, 'utf-8')
    const source = parseSlide(raw)
    const inline = { ...slide }
    slide.source = {
      filepath: path,
      ...source,
    }
    slide.inline = inline
    Object.assign(slide, slide.source)
    slide.frontmatter = {
      ...slide.source.frontmatter,
      ...inline.frontmatter,
    }

    data.features = mergeFeatureFlags(data.features, detectFeatures(raw))
    entries.add(path)
  }

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
