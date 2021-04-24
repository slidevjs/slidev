import { promises as fs } from 'fs'
import matter from 'gray-matter'
import YAML from 'js-yaml'

export interface SlidesMarkdownInfo {
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

export interface SlidesMarkdown {
  filepath?: string
  slides: SlidesMarkdownInfo[]
  options: ParseOptions
  raw: string
}

export async function load(
  filepath: string,
  options?: ParseOptions,
) {
  const markdown = await fs.readFile(filepath, 'utf-8')

  return parse(markdown, filepath, options)
}

export async function save(data: SlidesMarkdown, filepath?: string) {
  filepath = filepath || data.filepath!

  await fs.writeFile(filepath, stringify(data), 'utf-8')
}

export function stringify(data: SlidesMarkdown) {
  return `${
    data.slides
      .map(stringifySlide)
      .join('\n')
      .trim()
  }\n`
}

export function filterDisabled(data: SlidesMarkdown) {
  data.slides = data.slides.filter(i => !i.frontmatter?.disabled)
  return data
}

function stringifySlide(data: SlidesMarkdownInfo, idx = 1) {
  if (!data.raw)
    prettifySlide(data)

  return (data.raw.startsWith('---') || idx === 0)
    ? data.raw
    : `------\n${data.raw}`
}

function prettifySlide(data: SlidesMarkdownInfo) {
  data.content = `\n${data.content.trim()}\n\n`
  data.raw = Object.keys(data.frontmatter || {}).length
    ? `---\n${YAML.safeDump(data.frontmatter).trim()}\n---\n${data.content}`
    : data.content
  return data
}

export function prettify(data: SlidesMarkdown) {
  data.slides.forEach(prettifySlide)
  return data
}

export function parse(
  markdown: string,
  filepath?: string,
  options: ParseOptions = {},
): SlidesMarkdown {
  const lines = markdown.split(/\n/g)
  const slides: SlidesMarkdownInfo[] = []
  let start = 0
  let dividers = 0

  function parseContent(raw: string) {
    const { data: frontmatter = {}, content } = matter(raw)
    return {
      raw,
      frontmatter,
      content,
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

  // make the first slide use cover layout by default
  if (slides[0])
    slides[0].frontmatter.layout ||= 'cover'

  return {
    raw: markdown,
    filepath,
    slides,
    options,
  }
}
