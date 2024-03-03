import YAML from 'js-yaml'
import { isObject, objectMap } from '@antfu/utils'
import type { FrontmatterStyle, SlidevFeatureFlags, SlidevMarkdown, SlidevPreparserExtension, SourceSlideInfo } from '@slidev/types'

export function stringify(data: SlidevMarkdown) {
  return `${data.slides.map(stringifySlide).join('\n').trim()}\n`
}

export function stringifySlide(data: SourceSlideInfo, idx = 0) {
  return (data.raw.startsWith('---') || idx === 0)
    ? data.raw
    : `---\n${data.raw.startsWith('\n') ? data.raw : `\n${data.raw}`}`
}

export function prettifySlide(data: SourceSlideInfo) {
  data.content = `\n${data.content.trim()}\n`
  data.raw = Object.keys(data.frontmatter || {}).length
    ? data.frontmatterStyle === 'yaml'
      ? `\`\`\`yaml\n${YAML.dump(data.frontmatter).trim()}\n\`\`\`\n${data.content}`
      : `---\n${YAML.dump(data.frontmatter).trim()}\n---\n${data.content}`
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

function safeParseYAML(str: string) {
  const res = YAML.load(str)
  return isObject(res) ? res : {}
}

function matter(code: string) {
  let type: FrontmatterStyle | undefined
  let raw: string | undefined

  const data: any = {}

  let content = code
    .replace(/^---.*\r?\n([\s\S]*?)---/, (_, f) => {
      type = 'frontmatter'
      raw = f
      Object.assign(data, safeParseYAML(f))
      return ''
    })

  if (type !== 'frontmatter') {
    content = content
      .replace(/^\s*```ya?ml([\s\S]*?)```/, (_, d) => {
        type = 'yaml'
        raw = d
        Object.assign(data, safeParseYAML(d))
        return ''
      })
  }

  return {
    type,
    raw,
    data,
    content,
  }
}

export function detectFeatures(code: string): SlidevFeatureFlags {
  return {
    katex: !!code.match(/\$.*?\$/) || !!code.match(/$\$\$/),
    monaco: !!code.match(/{monaco.*}/),
    tweet: !!code.match(/<Tweet\b/),
    mermaid: !!code.match(/^```mermaid/m),
  }
}

export function parseSlide(raw: string): Omit<SourceSlideInfo, 'filepath' | 'index' | 'start' | 'end'> {
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

  async function slice(end: number) {
    if (start === end)
      return
    const raw = lines.slice(start, end).join('\n')
    const slide = {
      ...parseSlide(raw),
      filepath,
      index: slides.length,
      start,
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
  }

  if (extensions) {
    for (const e of extensions) {
      if (e.transformRawLines)
        await e.transformRawLines(lines)
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd()
    if (line.match(/^---+/)) {
      await slice(i)

      const next = lines[i + 1]
      // found frontmatter, skip next dash
      if (line.match(/^---([^-].*)?$/) && !next?.match(/^\s*$/)) {
        start = i
        for (i += 1; i < lines.length; i++) {
          if (lines[i].trimEnd().match(/^---$/))
            break
        }
      }
    }
    // skip code block
    else if (line.startsWith('```')) {
      for (i += 1; i < lines.length; i++) {
        if (lines[i].startsWith('```'))
          break
      }
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

export function mergeFeatureFlags(a: SlidevFeatureFlags, b: SlidevFeatureFlags): SlidevFeatureFlags {
  return objectMap(a, (k, v) => [k, v || b[k]])
}

export * from './utils'
export * from './config'
