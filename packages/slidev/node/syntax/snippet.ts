import type { ResolvedSlidevOptions } from '@slidev/types'
import type { MarkdownExit } from 'markdown-exit'
import fs from 'node:fs'
import path from 'node:path'
import { slash } from '@antfu/utils'
import { yellow } from 'ansis'
import lz from 'lz-string'
import { regexSlideSourceId } from '../vite/common'
import { monacoWriterWhitelist } from '../vite/monacoWrite'

function dedent(text: string): string {
  const lines = text.split('\n')

  const minIndentLength = lines.reduce((acc, line) => {
    for (let i = 0; i < line.length; i++) {
      if (line[i] !== ' ' && line[i] !== '\t')
        return Math.min(i, acc)
    }
    return acc
  }, Number.POSITIVE_INFINITY)

  if (minIndentLength < Number.POSITIVE_INFINITY)
    return lines.map(x => x.slice(minIndentLength)).join('\n')

  return text
}

/* eslint-disable regexp/no-super-linear-backtracking */
const markers = [
  {
    start: /^\s*\/\/\s*#?region\b\s*(.*?)\s*$/,
    end: /^\s*\/\/\s*#?endregion\b\s*(.*?)\s*$/,
  },
  {
    start: /^\s*<!--\s*#?region\b\s*(.*?)\s*-->/,
    end: /^\s*<!--\s*#?endregion\b\s*(.*?)\s*-->/,
  },
  {
    start: /^\s*\/\*\s*#region\b\s*(.*?)\s*\*\//,
    end: /^\s*\/\*\s*#endregion\b\s*(.*?)\s*\*\//,
  },
  {
    start: /^\s*#[rR]egion\b\s*(.*?)\s*$/,
    end: /^\s*#[eE]nd ?[rR]egion\b\s*(.*?)\s*$/,
  },
  {
    start: /^\s*#\s*#?region\b\s*(.*?)\s*$/,
    end: /^\s*#\s*#?endregion\b\s*(.*?)\s*$/,
  },
  {
    start: /^\s*(?:--|::|@?REM)\s*#region\b\s*(.*?)\s*$/,
    end: /^\s*(?:--|::|@?REM)\s*#endregion\b\s*(.*?)\s*$/,
  },
  {
    start: /^\s*#pragma\s+region\b\s*(.*?)\s*$/,
    end: /^\s*#pragma\s+endregion\b\s*(.*?)\s*$/,
  },
  {
    start: /^\s*\(\*\s*#region\b\s*(.*?)\s*\*\)/,
    end: /^\s*\(\*\s*#endregion\b\s*(.*?)\s*\*\)/,
  },
]
/* eslint-enable regexp/no-super-linear-backtracking */

function findRegion(lines: Array<string>, regionName: string) {
  let chosen: { re: (typeof markers)[number], start: number } | null = null
  // find the regex pair for a start marker that matches the given region name
  for (let i = 0; i < lines.length; i++) {
    for (const re of markers) {
      if (re.start.exec(lines[i])?.[1] === regionName) {
        chosen = { re, start: i + 1 }
        break
      }
    }
    if (chosen)
      break
  }
  if (!chosen)
    return null

  let counter = 1
  // scan the rest of the lines to find the matching end marker, handling nested markers
  for (let i = chosen.start; i < lines.length; i++) {
    // check for an inner start marker for the same region
    if (chosen.re.start.exec(lines[i])?.[1] === regionName) {
      counter++
      continue
    }
    // check for an end marker for the same region
    const endRegion = chosen.re.end.exec(lines[i])?.[1]
    // allow empty region name on the end marker as a fallback
    if (endRegion === regionName || endRegion === '') {
      if (--counter === 0) {
        return {
          ...chosen,
          end: i,
        }
      }
    }
  }

  return null
}

// eslint-disable-next-line regexp/no-super-linear-backtracking
const RE_SNIPPET_IMPORT = /^<<<[ \t]*(\S.*?)(#[\w-]+)?[ \t]*(?:[ \t](\S+?))?[ \t]*(\{.*)?$/

export default function MarkdownItSnippet(md: MarkdownExit, { userRoot, data: { watchFiles, slides } }: ResolvedSlidevOptions) {
  md.block.ruler.before('fence', 'snippet_import', (state, startLine, _endLine, silent) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]

    const lineText = state.src.slice(pos, max)
    const match = lineText.match(RE_SNIPPET_IMPORT)

    if (!match)
      return false
    if (silent)
      return true

    let [, filepath = '', regionName = '', lang = '', meta = ''] = match

    const slideNo = state.env.id?.match(regexSlideSourceId)
    const slide = slideNo ? slides[slideNo[1] - 1] : null

    if (!slide) {
      console.warn(yellow(`[markdown-it-snippet] Snippet syntax is not supported in ${state.env.id || 'unknown source'}. Skipped.`))
      return false
    }

    const dir = path.dirname(slide.source.filepath)
    const src = slash(
      filepath.startsWith('@/')
        ? path.resolve(userRoot, filepath.slice(2))
        : path.resolve(dir, filepath),
    )

    lang = lang.trim() || path.extname(filepath).slice(1)
    meta = meta.trim()

    const isAFile = fs.existsSync(src) && fs.statSync(src).isFile()
    if (!isAFile) {
      throw new Error(`Code snippet path not found: ${src}`)
    }

    let content = fs.readFileSync(src, 'utf8')

    if (regionName) {
      const lines = content.split(/\r?\n/)
      const region = findRegion(lines, regionName.slice(1))
      if (region) {
        content = dedent(
          lines
            .slice(region.start, region.end)
            .filter(l => !(region.re.start.test(l) || region.re.end.test(l)))
            .join('\n'),
        )
      }
    }

    if (meta.includes('{monaco-write}')) {
      monacoWriterWhitelist.add(filepath)
      lang = lang.trim()
      meta = meta.replace('{monaco-write}', '').trim() || '{}'
      const encoded = lz.compressToBase64(content)

      const token = state.push('html_block', '', 0)
      token.content = `<Monaco writable="${filepath}" code-lz="${encoded}" lang="${lang}" v-bind="${meta}" />\n`
      token.map = [startLine, startLine + 1]
    }
    else {
      watchFiles[src] ??= new Set()
      watchFiles[src].add(slide.index)

      const token = state.push('fence', 'code', 0)
      token.info = `${lang} ${meta}`.trim()
      token.content = content.endsWith('\n') ? content : `${content}\n`
      token.map = [startLine, startLine + 1]
    }

    state.line = startLine + 1
    return true
  }, { alt: ['paragraph', 'reference', 'blockquote', 'list'] })
}
