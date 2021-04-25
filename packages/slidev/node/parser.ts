import { promises as fs } from 'fs'
import matter from 'gray-matter'
import YAML from 'js-yaml'

export interface SlideInfo {
  start: number
  end: number
  raw: string
  content: string
  note?: string
  frontmatter: Record<string, any>
}

export interface ParseOptions {
  /**
   * Transform Monaco block
   *
   * @default true
   */
  enabledMonaco?: boolean
}

export interface SlidevConfig {
  title: string
  theme: string
  remoteAssets: boolean
}

export interface SlidevMarkdown {
  filepath?: string
  slides: SlideInfo[]
  options: ParseOptions
  raw: string
  config: SlidevConfig
}

export async function load(
  filepath: string,
  options?: ParseOptions,
) {
  const markdown = await fs.readFile(filepath, 'utf-8')

  return parse(markdown, filepath, options)
}

export async function save(data: SlidevMarkdown, filepath?: string) {
  filepath = filepath || data.filepath!

  await fs.writeFile(filepath, stringify(data), 'utf-8')
}

export function stringify(data: SlidevMarkdown) {
  return `${
    data.slides
      .map(stringifySlide)
      .join('\n')
      .trim()
  }\n`
}

export function filterDisabled(data: SlidevMarkdown) {
  data.slides = data.slides.filter(i => !i.frontmatter?.disabled)
  return data
}

function stringifySlide(data: SlideInfo, idx = 1) {
  if (!data.raw)
    prettifySlide(data)

  return (data.raw.startsWith('---') || idx === 0)
    ? data.raw
    : `------\n${data.raw}`
}

function prettifySlide(data: SlideInfo) {
  data.content = `\n${data.content.trim()}\n`
  data.raw = Object.keys(data.frontmatter || {}).length
    ? `---\n${YAML.safeDump(data.frontmatter).trim()}\n---\n${data.content}`
    : data.content
  if (data.note)
    data.raw += `\n<!--\n${data.note.trim()}\n-->\n`
  else
    data.raw += '\n'
  return data
}

export function prettify(data: SlidevMarkdown) {
  data.slides.forEach(prettifySlide)
  return data
}

export function parse(
  markdown: string,
  filepath?: string,
  options: ParseOptions = {},
): SlidevMarkdown {
  const lines = markdown.split(/\n/g)
  const slides: SlideInfo[] = []
  let start = 0
  let dividers = 0

  function parseContent(raw: string) {
    const result = matter(raw)
    let note: string | undefined
    const content = result.content
      .trim()
      .replace(/<!--([\s\S]*)-->$/g, (_, v = '') => {
        note = v.trim()
        return ''
      })
    return {
      raw,
      content,
      frontmatter: result.data || {},
      note,
    }
  }

  lines.forEach((line, i) => {
    line = line.trimRight()

    if (line === '---')
      dividers += 1

    // more than than 4 dashes
    const isHardDivider = !!line.match(/^----+$/)

    if (dividers >= 3 || isHardDivider) {
      const end = i
      const raw = lines.slice(start, end).join('\n')
      slides.push({
        start,
        end,
        ...parseContent(raw),
      })
      dividers = isHardDivider ? 2 : 1
      start = isHardDivider ? i + 1 : i
    }
  })

  if (start !== lines.length - 1) {
    const raw = lines.slice(start).join('\n')
    slides.push({
      start,
      end: lines.length,
      ...parseContent(raw),
    })
  }

  const headmatter = slides?.[0].frontmatter || {}
  const config: SlidevConfig = Object.assign({}, headmatter.config || {})

  config.theme ||= headmatter.theme || '@slidev/theme-default'
  config.title ||= headmatter.title || (slides[0].content.match(/^# (.*)$/m)?.[1] || '').trim()
  config.remoteAssets ??= headmatter.remoteAssets ?? true

  return {
    raw: markdown,
    filepath,
    slides,
    options,
    config,
  }
}
