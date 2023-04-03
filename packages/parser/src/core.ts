import YAML from 'js-yaml'
import { isObject, isTruthy, objectMap } from '@antfu/utils'
import type { PreparserExtensionFromHeadmatter, SlideInfo, SlideInfoBase, SlidevFeatureFlags, SlidevMarkdown, SlidevPreparserExtension, SlidevThemeMeta } from '@slidev/types'
import { resolveConfig } from './config'

export function stringify(data: SlidevMarkdown) {
  return `${
    data.slides
      .filter(slide => slide.source === undefined || slide.inline !== undefined)
      .map((slide, idx) => stringifySlide(slide.inline || slide, idx))
      .join('\n')
      .trim()
  }\n`
}

export function filterDisabled(data: SlidevMarkdown) {
  data.slides = data.slides.filter(i => !i.frontmatter?.disabled)
  return data
}

export function stringifySlide(data: SlideInfoBase, idx = 0) {
  if (data.raw == null)
    prettifySlide(data)

  return (data.raw.startsWith('---') || idx === 0)
    ? data.raw
    : `---\n${data.raw.startsWith('\n') ? data.raw : `\n${data.raw}`}`
}

export function prettifySlide(data: SlideInfoBase) {
  data.content = `\n${data.content.trim()}\n`
  data.raw = Object.keys(data.frontmatter || {}).length
    ? `---\n${YAML.dump(data.frontmatter).trim()}\n---\n${data.content}`
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

function matter(code: string) {
  let data: any = {}
  const content = code.replace(/^---.*\r?\n([\s\S]*?)---/,
    (_, d) => {
      data = YAML.load(d)
      if (!isObject(data))
        data = {}
      return ''
    })
  return { data, content }
}

export function detectFeatures(code: string): SlidevFeatureFlags {
  return {
    katex: !!code.match(/\$.*?\$/) || !!code.match(/$\$\$/),
    monaco: !!code.match(/{monaco.*}/),
    tweet: !!code.match(/<Tweet\b/),
    mermaid: !!code.match(/^```mermaid/m),
  }
}

export function parseSlide(raw: string): SlideInfoBase {
  const result = matter(raw)
  let note: string | undefined
  const frontmatter = result.data || {}
  let content = result.content.trim()

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
    note,
  }
}

export async function parse(
  markdown: string,
  filepath?: string,
  themeMeta?: SlidevThemeMeta,
  extensions?: SlidevPreparserExtension[],
  onHeadmatter?: PreparserExtensionFromHeadmatter,
): Promise<SlidevMarkdown> {
  const lines = markdown.split(/\r?\n/g)
  const slides: SlideInfo[] = []

  let start = 0

  async function slice(end: number) {
    if (start === end)
      return
    const raw = lines.slice(start, end).join('\n')
    const slide = {
      ...parseSlide(raw),
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

  // identify the headmatter, to be able to load preparser extensions
  // (strict parsing based on the parsing code)
  {
    let hm = ''
    if (lines[0].match(/^---([^-].*)?$/) && !lines[1]?.match(/^\s*$/)) {
      let hEnd = 1
      while (hEnd < lines.length && !lines[hEnd].trimEnd().match(/^---$/))
        hEnd++
      hm = lines.slice(1, hEnd).join('\n')
    }
    if (onHeadmatter) {
      const o = YAML.load(hm) ?? {}
      extensions = await onHeadmatter(o, extensions ?? [], filepath)
    }
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

  const headmatter = slides[0]?.frontmatter || {}
  headmatter.title = headmatter.title || slides[0]?.title
  const config = resolveConfig(headmatter, themeMeta, filepath)
  const features = detectFeatures(markdown)

  return {
    raw: markdown,
    filepath,
    slides,
    config,
    features,
    headmatter,
    themeMeta,
  }
}

export function mergeFeatureFlags(a: SlidevFeatureFlags, b: SlidevFeatureFlags): SlidevFeatureFlags {
  return objectMap(a, (k, v) => [k, v || b[k]])
}

// types auto discovery for TypeScript monaco
export function scanMonacoModules(md: string) {
  const typeModules = new Set<string>()

  md.replace(/^```(\w+?)\s*{monaco([\w:,-]*)}[\s\n]*([\s\S]+?)^```/mg, (full, lang = 'ts', options: string, code: string) => {
    options = options || ''
    lang = lang.trim()
    if (lang === 'ts' || lang === 'typescript') {
      Array.from(code.matchAll(/\s+from\s+(["'])([\/\w@-]+)\1/g))
        .map(i => i[2])
        .filter(isTruthy)
        .map(i => typeModules.add(i))
    }
    return ''
  })

  return Array.from(typeModules)
}

export * from './utils'
export * from './config'
