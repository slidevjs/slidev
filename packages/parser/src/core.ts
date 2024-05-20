import YAML from 'yaml'
import { ensurePrefix } from '@antfu/utils'
import type { FrontmatterStyle, SlidevDetectedFeatures, SlidevMarkdown, SlidevPreparserExtension, SourceSlideInfo } from '@slidev/types'

export function stringify(data: SlidevMarkdown) {
  return `${data.slides.map(stringifySlide).join('\n').trim()}\n`
}

export function stringifySlide(data: SourceSlideInfo, idx = 0) {
  return (data.raw.startsWith('---') || idx === 0)
    ? data.raw
    : `---\n${ensurePrefix('\n', data.raw)}`
}

export function prettifySlide(data: SourceSlideInfo) {
  const trimed = data.content.trim()
  data.content = trimed ? `\n${data.content.trim()}\n` : ''
  data.raw = data.frontmatterDoc?.contents
    ? data.frontmatterStyle === 'yaml'
      ? `\`\`\`yaml\n${data.frontmatterDoc.toString().trim()}\n\`\`\`\n${data.content}`
      : `---\n${data.frontmatterDoc.toString().trim()}\n---\n${data.content}`
    : data.content
  if (data.note)
    data.raw += `\n<!--\n${data.note.trim()}\n-->\n`
  return data
}

export function prettify(data: SlidevMarkdown) {
  data.slides.forEach(prettifySlide)
  return data
}

function matter(code: string) {
  let type: FrontmatterStyle | undefined
  let raw: string | undefined

  let content = code
    .replace(/^---.*\r?\n([\s\S]*?)---/, (_, f) => {
      type = 'frontmatter'
      raw = f
      return ''
    })

  if (type !== 'frontmatter') {
    content = content
      .replace(/^\s*```ya?ml([\s\S]*?)```/, (_, f) => {
        type = 'yaml'
        raw = f
        return ''
      })
  }

  const doc = YAML.parseDocument(raw || '')

  return {
    type,
    raw,
    doc,
    data: doc.toJSON(),
    content,
  }
}

export function detectFeatures(code: string): SlidevDetectedFeatures {
  return {
    katex: !!code.match(/\$.*?\$/) || !!code.match(/\$\$/),
    monaco: code.match(/{monaco.*}/) ? scanMonacoReferencedMods(code) : false,
    tweet: !!code.match(/<Tweet\b/),
    mermaid: !!code.match(/^```mermaid/m),
  }
}

export function parseSlide(raw: string): Omit<SourceSlideInfo, 'filepath' | 'index' | 'start' | 'contentStart' | 'end'> {
  const matterResult = matter(raw)
  let note: string | undefined
  const frontmatter = matterResult.data || {}
  let content = matterResult.content.trim()

  const comments = Array.from(content.matchAll(/<!--([\s\S]*?)-->/g))
  if (comments.length) {
    const last = comments[comments.length - 1]
    if (last.index !== undefined && last.index + last[0].length >= content.length) {
      note = last[1].trim()
      content = content.slice(0, last.index).trim()
    }
  }

  let title
  let level
  if (frontmatter.title || frontmatter.name) {
    title = frontmatter.title || frontmatter.name
  }
  else {
    const match = content.match(/^(#+) (.*)$/m)
    title = match?.[2]?.trim()
    level = match?.[1]?.length
  }
  if (frontmatter.level)
    level = frontmatter.level || 1

  return {
    raw,
    title,
    level,
    content,
    frontmatter,
    frontmatterStyle: matterResult.type,
    frontmatterDoc: matterResult.doc,
    frontmatterRaw: matterResult.raw,
    note,
  }
}

export async function parse(
  markdown: string,
  filepath: string,
  extensions?: SlidevPreparserExtension[],
): Promise<SlidevMarkdown> {
  const lines = markdown.split(/\r?\n/g)
  const slides: SourceSlideInfo[] = []

  let start = 0
  let contentStart = 0

  async function slice(end: number) {
    if (start === end)
      return
    const raw = lines.slice(start, end).join('\n')
    const slide: SourceSlideInfo = {
      ...parseSlide(raw),
      filepath,
      index: slides.length,
      start,
      contentStart,
      end,
    }
    if (extensions) {
      for (const e of extensions) {
        if (e.transformSlide) {
          const newContent = await e.transformSlide(slide.content, slide.frontmatter)
          if (newContent !== undefined)
            slide.content = newContent
        }
      }
    }
    slides.push(slide)
    start = end + 1
    contentStart = end + 1
  }

  if (extensions) {
    for (const e of extensions) {
      if (e.transformRawLines)
        await e.transformRawLines(lines)
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd()
    if (line.startsWith('---')) {
      await slice(i)

      const next = lines[i + 1]
      // found frontmatter, skip next dash
      if (line[3] !== '-' && next?.trim()) {
        start = i
        for (i += 1; i < lines.length; i++) {
          if (lines[i].trimEnd() === '---')
            break
        }
        contentStart = i + 1
      }
    }
    // skip code block
    else if (line.trimStart().startsWith('```')) {
      const codeBlockLevel = line.match(/^\s*`+/)![0]
      let j = i + 1
      for (; j < lines.length; j++) {
        if (lines[j].startsWith(codeBlockLevel))
          break
      }
      // Update i only when code block ends
      if (j !== lines.length)
        i = j
    }
  }

  if (start <= lines.length - 1)
    await slice(lines.length)

  return {
    filepath,
    raw: markdown,
    slides,
  }
}

function scanMonacoReferencedMods(md: string) {
  const types = new Set<string>()
  const deps = new Set<string>()
  md.replace(
    /^```(\w+?)\s*{monaco(.*?)}[\s\n]*([\s\S]+?)^```/mg,
    (full, lang = 'ts', kind: string, code: string) => {
      lang = lang.trim()
      const isDep = kind === '-run'
      if (['js', 'javascript', 'ts', 'typescript'].includes(lang)) {
        for (const [, , specifier] of code.matchAll(/\s+from\s+(["'])([\/\.\w@-]+)\1/g)) {
          if (specifier) {
            if (!'./'.includes(specifier))
              types.add(specifier) // All local TS files are loaded by globbing
            if (isDep)
              deps.add(specifier)
          }
        }
      }
      return ''
    },
  )
  return {
    types: Array.from(types),
    deps: Array.from(deps),
  }
}

export * from './utils'
export * from './config'
