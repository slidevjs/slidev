import YAML from 'js-yaml'
import { isObject, isTruthy, objectMap } from '@antfu/utils'
import { SlideInfo, SlideInfoBase, SlidevConfig, SlidevFeatureFlags, SlidevMarkdown } from '@slidev/types'
import { parseAspectRatio } from './utils'

export function stringify(data: SlidevMarkdown) {
  return `${
    data.slides
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
  const content = result.content
    .trim()
    .replace(/<!--([\s\S]*)-->$/g, (_, v = '') => {
      note = v.trim()
      return ''
    })

  const title = frontmatter.title || frontmatter.name || content.match(/^#+ (.*)$/m)?.[1]?.trim()

  return {
    raw,
    title,
    content,
    frontmatter,
    note,
  }
}

export function parse(
  markdown: string,
  filepath?: string,
): SlidevMarkdown {
  const lines = markdown.split(/\r?\n/g)
  const slides: SlideInfo[] = []

  let start = 0

  function slice(end: number) {
    if (start === end)
      return
    const raw = lines.slice(start, end).join('\n')
    slides.push({
      ...parseSlide(raw),
      index: slides.length,
      start,
      end,
    })
    start = end + 1
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimRight()
    if (line.match(/^---+/)) {
      slice(i)

      const next = lines[i + 1]
      // found frontmatter, skip next dash
      if (line.match(/^---([^-].*)?$/) && !next?.match(/^\s*$/)) {
        start = i
        for (i += 1; i < lines.length; i++) {
          if (lines[i].trimRight().match(/^---$/))
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
    slice(lines.length)

  const headmatter = slides[0]?.frontmatter || {}
  const defaultConfig: SlidevConfig = {
    theme: 'default',
    title: slides[0]?.title || 'Slidev',
    remoteAssets: true,
    monaco: 'dev',
    download: false,
    info: false,
    highlighter: 'prism',
    colorSchema: 'auto',
    routerMode: 'history',
    aspectRatio: 16 / 9,
    canvasWidth: 980,
    selectable: false,
    themeConfig: {},
  }
  const config: SlidevConfig = Object.assign(
    defaultConfig,
    headmatter.config || {},
    headmatter,
  )
  if (config.colorSchema !== 'dark' && config.colorSchema !== 'light')
    config.colorSchema = 'auto'
  config.aspectRatio = parseAspectRatio(config.aspectRatio)

  return {
    raw: markdown,
    filepath,
    slides,
    config,
    features: detectFeatures(markdown),
    headmatter,
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
