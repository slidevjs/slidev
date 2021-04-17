import { promises as fs } from 'fs'

export interface SlidesMarkdownInfo {
  start: number
  end: number
  raw: string
  content: string
  note?: string
  frontmatter?: string
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
}

export async function loadSlidesMarkdown(
  filepath: string,
  options?: ParseOptions,
) {
  const markdown = await fs.readFile(filepath, 'utf-8')

  return parseSlidesMarkdown(markdown, filepath, options)
}

export function parseSlidesMarkdown(
  markdown: string,
  filepath?: string,
  options: ParseOptions = {},
): SlidesMarkdown {
  const lines = markdown.split(/\n/g)
  const slides: SlidesMarkdownInfo[] = []
  let start = 0
  let dividers = 0

  lines.forEach((line, i) => {
    line = line.trimRight()

    if (line === '---')
      dividers += 1

    // more than than 4 dashes
    const isHardDivider = !!line.match(/^----+$/)

    if (dividers >= 3 || isHardDivider) {
      const end = isHardDivider ? i - 1 : i
      const raw = lines.slice(start, end).join('\n')
      slides.push({
        start,
        end,
        raw,
        content: raw,
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
      content: raw,
      raw,
    })
  }

  return {
    filepath,
    slides,
    options,
  }
}
