import type { FrontmatterStyle, SlidevDetectedFeatures, SlidevMarkdown, SlidevPreparserExtension, SourceSlideInfo } from '@slidev/types'
import { ensurePrefix } from '@antfu/utils'
import YAML from 'yaml'

export interface SlidevParserOptions {
  noParseYAML?: boolean
  preserveCR?: boolean
}

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

function matter(code: string, options: SlidevParserOptions) {
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

  const doc = raw && !options.noParseYAML ? YAML.parseDocument(raw) : undefined

  return {
    type,
    raw,
    doc,
    data: doc?.toJSON(),
    content,
  }
}

const IMAGE_EXTENSIONS = /\.(?:png|jpe?g|gif|svg|webp|avif|ico|bmp|tiff?)$/i

/**
 * Extract image URLs from slide content and frontmatter.
 * Strips code blocks first to avoid false positives.
 */
export function extractImagesUsage(content: string, frontmatter: Record<string, any>): string[] {
  const images = new Set<string>()

  // Collect from frontmatter keys
  for (const key of ['image', 'backgroundImage', 'background']) {
    const val = frontmatter[key]
    if (typeof val === 'string' && val && !val.startsWith('data:')) {
      // For `background`, only include if it looks like an image URL
      if (key === 'background') {
        if (IMAGE_EXTENSIONS.test(val) || val.startsWith('/') || val.startsWith('http'))
          images.add(val)
      }
      else {
        images.add(val)
      }
    }
  }

  // Strip code blocks to avoid false positives
  const stripped = content.replace(/^```[\s\S]+?^```/gm, '')

  // Markdown images: ![alt](url)
  for (const [, url] of stripped.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
    if (url && !url.startsWith('data:'))
      images.add(url.trim())
  }

  // Vue component props: src="url", image="url"
  for (const [, url] of stripped.matchAll(/\b(?:src|image)=["']([^"']+)["']/g)) {
    if (url && !url.startsWith('data:') && !url.includes('{{') && IMAGE_EXTENSIONS.test(url))
      images.add(url.trim())
  }

  // Vue bound props: :src="'/path/to/img.png'"
  for (const [, url] of stripped.matchAll(/:(?:src|image)=["']'([^']+)'["']/g)) {
    if (url && !url.startsWith('data:') && IMAGE_EXTENSIONS.test(url))
      images.add(url.trim())
  }

  // CSS url() with image extension filter
  for (const [, url] of stripped.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (url && !url.startsWith('data:') && IMAGE_EXTENSIONS.test(url))
      images.add(url.trim())
  }

  return Array.from(images)
}

export function detectFeatures(code: string): SlidevDetectedFeatures {
  return {
    katex: !!code.match(/\$.*?\$/) || !!code.match(/\$\$/),
    monaco: code.match(/\{monaco.*\}/) ? scanMonacoReferencedMods(code) : false,
    tweet: !!code.match(/<Tweet\b/),
    mermaid: !!code.match(/^```mermaid/m),
  }
}

export function parseSlide(raw: string, options: SlidevParserOptions = {}): Omit<SourceSlideInfo, 'filepath' | 'index' | 'start' | 'contentStart' | 'end'> {
  const matterResult = matter(raw, options)
  let note: string | undefined
  const frontmatter = matterResult.data || {}
  let content = matterResult.content.trim()
  const revision = hash(raw.trim())

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

  const images = extractImagesUsage(content, frontmatter)

  return {
    raw,
    title,
    level,
    revision,
    content,
    contentRaw: content,
    frontmatter,
    frontmatterStyle: matterResult.type,
    frontmatterDoc: matterResult.doc,
    frontmatterRaw: matterResult.raw,
    note,
    images,
  }
}

export async function parse(
  markdown: string,
  filepath: string,
  extensions?: SlidevPreparserExtension[],
  options: SlidevParserOptions = {},
): Promise<SlidevMarkdown> {
  const lines = markdown.split(options.preserveCR ? '\n' : /\r?\n/g)
  const slides: SourceSlideInfo[] = []

  let start = 0
  let contentStart = 0

  async function slice(end: number) {
    if (start === end)
      return
    const raw = lines.slice(start, end).join('\n')
    const slide: SourceSlideInfo = {
      ...parseSlide(raw, options),
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
          if (typeof slide.frontmatter.title === 'string') {
            slide.title = slide.frontmatter.title
          }
          if (typeof slide.frontmatter.level === 'number') {
            slide.level = slide.frontmatter.level
          }
        }

        if (e.transformNote) {
          const newNote = await e.transformNote(slide.note, slide.frontmatter)
          if (newNote !== undefined)
            slide.note = newNote
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

export function parseSync(
  markdown: string,
  filepath: string,
  options: SlidevParserOptions = {},
): SlidevMarkdown {
  const lines = markdown.split(options.preserveCR ? '\n' : /\r?\n/g)
  const slides: SourceSlideInfo[] = []

  let start = 0
  let contentStart = 0

  function slice(end: number) {
    if (start === end)
      return
    const raw = lines.slice(start, end).join('\n')
    const slide: SourceSlideInfo = {
      ...parseSlide(raw, options),
      filepath,
      index: slides.length,
      start,
      contentStart,
      end,
    }
    slides.push(slide)
    start = end + 1
    contentStart = end + 1
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd()
    if (line.startsWith('---')) {
      slice(i)

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
    slice(lines.length)

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
    /^```(\w+)\s*\{monaco([^}]*)\}\s*(\S[\s\S]*?)^```/gm,
    (full, lang = 'ts', kind: string, code: string) => {
      lang = lang.trim()
      const isDep = kind === '-run'
      if (['js', 'javascript', 'ts', 'typescript'].includes(lang)) {
        for (const [, , specifier] of code.matchAll(/\s+from\s+(["'])([/.\w@-]+)\1/g)) {
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

function hash(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36).slice(0, 12)
}

export * from './config'
export * from './utils'
