import YAML from 'js-yaml'
import { isObject, isTruthy, objectPick, range, uniq } from '@antfu/utils'
import { SlideInfo, SlidevConfig, SlidevMarkdown } from '@slidev/types'

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

export function stringifySlide(data: SlideInfo, idx = 1) {
  if (!data.raw)
    prettifySlide(data)

  return (data.raw.startsWith('---') || idx === 0)
    ? data.raw
    : `---\n${data.raw.startsWith('\n') ? data.raw : `\n${data.raw}`}`
}

export function prettifySlide(data: SlideInfo) {
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
  const content = code.replace(/^---([\s\S]*?)---/,
    (_, d) => {
      data = YAML.load(d)
      if (!isObject(data))
        data = {}
      return ''
    })
  return { data, content }
}

export function detectFeatures(code: string) {
  return {
    katex: !!code.match(/\$.*?\$/) || !!code.match(/$\$\$/),
    monaco: !!code.match(/{monaco.*}/),
    tweet: !!code.match(/<Tweet\b/),
    mermaid: !!code.match(/^```mermaid/m),
  }
}

export function parse(
  markdown: string,
  filepath?: string,
): SlidevMarkdown {
  const lines = markdown.split(/\r?\n/g)
  const slides: SlideInfo[] = []

  function parseContent(raw: string) {
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

  let start = 0

  function slice(end: number) {
    if (start === end)
      return
    const raw = lines.slice(start, end).join('\n')
    slides.push({
      index: slides.length,
      start,
      end,
      ...parseContent(raw),
    })
    start = end + 1
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimRight()
    if (line.match(/^---+$/)) {
      slice(i)

      const next = lines[i + 1]
      // found frontmatter, skip next dash
      if (line.length === 3 && !next?.match(/^\s*$/)) {
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
        if (lines[i]?.includes('<style'))
          lines[i] = lines[i].replace('<style', '<style ___in-code-block___')

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
  }
  const config: SlidevConfig = Object.assign(
    defaultConfig,
    headmatter.config || {},
    objectPick(headmatter, Object.keys(defaultConfig)),
  )
  if (config.colorSchema !== 'dark' && config.colorSchema !== 'light')
    config.colorSchema = 'auto'

  return {
    raw: markdown,
    filepath,
    slides,
    config,
    features: detectFeatures(markdown),
    headmatter,
  }
}

/**
 * 1,3-5,8 => [1, 3, 4, 5, 8]
 */
export function parseRangeString(total: number, rangeStr?: string) {
  if (!rangeStr || rangeStr === 'all' || rangeStr === '*')
    return range(1, total + 1)

  const pages: number[] = []
  for (const part of rangeStr.split(/[,;]/g)) {
    if (!part.includes('-')) {
      pages.push(+part)
    }
    else {
      const [start, end] = part.split('-', 2)
      pages.push(
        ...range(+start, !end ? (total + 1) : (+end + 1)),
      )
    }
  }

  return uniq(pages).filter(i => i <= total).sort((a, b) => a - b)
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
