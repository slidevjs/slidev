import YAML from 'js-yaml'
import { isObject, objectPick } from '@antfu/utils'
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

function stringifySlide(data: SlideInfo, idx = 1) {
  if (!data.raw)
    prettifySlide(data)

  return (data.raw.startsWith('---') || idx === 0)
    ? data.raw
    : `---\n${data.raw.startsWith('\n') ? data.raw : `\n${data.raw}`}`
}

function prettifySlide(data: SlideInfo) {
  data.content = `\n${data.content.trim()}\n`
  data.raw = Object.keys(data.frontmatter || {}).length
    ? `---\n${YAML.safeDump(data.frontmatter).trim()}\n---\n${data.content}`
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
      data = YAML.safeLoad(d)
      if (!isObject(data))
        data = {}
      return ''
    })
  return { data, content }
}

export function parse(
  markdown: string,
  filepath?: string,
): SlidevMarkdown {
  const lines = markdown.split(/\n/g)
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
    info: true,
    highlighter: 'prism',
  }
  const config: SlidevConfig = Object.assign(
    defaultConfig,
    headmatter.config || {},
    objectPick(headmatter, Object.keys(defaultConfig)),
  )

  return {
    raw: markdown,
    filepath,
    slides,
    config,
  }
}
