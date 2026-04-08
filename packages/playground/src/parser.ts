import YAML from 'yaml'

export interface ParsedSlide {
  index: number
  frontmatter: Record<string, any>
  content: string
  note?: string
}

export interface ParsedPresentation {
  config: Record<string, any>
  slides: ParsedSlide[]
}

const NOTE_RE = /<!--([\s\S]*?)-->/
const NOTE_REPLACE_RE = /<!--[\s\S]*?-->/g

export function parseMarkdown(markdown: string): ParsedPresentation {
  // Split slides by --- separator (must be on its own line)
  const lines = markdown.split('\n')
  const slideBreaks: number[] = [-1]

  // Find all slide separators
  // First --- pair is global frontmatter, subsequent --- are slide separators
  let inFrontmatter = false
  let frontmatterEnd = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === '---') {
      if (i === 0) {
        inFrontmatter = true
        continue
      }
      if (inFrontmatter) {
        inFrontmatter = false
        frontmatterEnd = i
        continue
      }
      slideBreaks.push(i)
    }
  }

  // Extract global frontmatter
  let globalConfig: Record<string, any> = {}
  let contentStartLine = 0

  if (frontmatterEnd > 0) {
    const frontmatterText = lines.slice(1, frontmatterEnd).join('\n')
    try {
      globalConfig = YAML.parse(frontmatterText) || {}
    }
    catch {}
    contentStartLine = frontmatterEnd + 1
  }

  // Build slide raw blocks
  const rawBlocks: string[] = []
  const allBreaks = [contentStartLine - 1, ...slideBreaks.filter(b => b >= contentStartLine)]

  if (allBreaks.length <= 1) {
    // No breaks after frontmatter, entire content is one slide
    rawBlocks.push(lines.slice(contentStartLine).join('\n'))
  }
  else {
    for (let i = 0; i < allBreaks.length; i++) {
      const start = allBreaks[i] + 1
      const end = i + 1 < allBreaks.length ? allBreaks[i + 1] : lines.length
      const block = lines.slice(start, end).join('\n').trim()
      if (block)
        rawBlocks.push(block)
    }
  }

  // Parse each slide block
  const slides: ParsedSlide[] = rawBlocks.map((block, index) => {
    const slideLines = block.split('\n')
    let frontmatter: Record<string, any> = {}
    let content = block
    let note: string | undefined

    // Check for per-slide frontmatter
    if (slideLines[0]?.trim() === '---') {
      const fmEnd = slideLines.findIndex((l, i) => i > 0 && l.trim() === '---')
      if (fmEnd > 0) {
        const fmText = slideLines.slice(1, fmEnd).join('\n')
        try {
          frontmatter = YAML.parse(fmText) || {}
        }
        catch {}
        content = slideLines.slice(fmEnd + 1).join('\n').trim()
      }
    }

    // Extract speaker notes (after <!-- --> comment)
    const noteMatch = NOTE_RE.exec(content)
    if (noteMatch) {
      note = noteMatch[1].trim()
      content = content.replace(NOTE_REPLACE_RE, '').trim()
    }

    return { index, frontmatter, content, note }
  })

  return { config: globalConfig, slides }
}
