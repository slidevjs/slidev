export interface SlidesMarkdownInfo {
  start: number
  end: number
  content: string
  note?: string
}

export function parseSlidesMarkdown(raw: string): SlidesMarkdownInfo[] {
  const lines = raw.split(/\n/g)
  const pages: SlidesMarkdownInfo[] = []
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
      pages.push({
        start,
        end,
        content: lines.slice(start, end).join('\n'),
      })
      dividers = isHardDivider ? 2 : 1
      start = isHardDivider ? i + 1 : i
    }
  })

  if (start !== lines.length - 1) {
    pages.push({
      start,
      end: lines.length,
      content: lines.slice(start).join('\n'),
    })
  }

  pages.push({
    start: lines.length,
    end: lines.length,
    content: '---\nlayout: end\n---',
  })

  return pages
}
