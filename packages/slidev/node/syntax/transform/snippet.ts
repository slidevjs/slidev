// Ported from https://github.com/vuejs/vitepress/blob/main/src/node/markdown/plugins/snippet.ts

import type { MarkdownTransformContext } from '@slidev/types'
import fs from 'node:fs'
import path from 'node:path'
import { slash } from '@antfu/utils'
import lz from 'lz-string'
import { monacoWriterWhitelist } from '../../vite/monacoWrite'

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

const reMonacoWrite = /^\{monaco-write\}/

/**
 * format: ">>> /path/to/file.extension#region language meta..."
 *    where #region, language and meta are optional
 *    meta should starts with {
 *    lang can contain special characters like C++, C#, F#, etc.
 *    path can be relative to the current file or absolute
 *    file extension is optional
 *    path can contain spaces and dots
 *
 * captures: ['/path/to/file.extension', '#region', 'language', '{meta}']
 */
export function transformSnippet({ s, slide, options }: MarkdownTransformContext) {
  const watchFiles = options.data.watchFiles
  const dir = path.dirname(slide.source?.filepath ?? options.entry ?? options.userRoot)

  s.replace(
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    /^<<<[ \t]*(\S.*?)(#[\w-]+)?[ \t]*(?:[ \t](\S+?))?[ \t]*(\{.*)?$/gm,
    (full, filepath = '', regionName = '', lang = '', meta = '') => {
      const src = slash(
        /^@\//.test(filepath)
          ? path.resolve(options.userRoot, filepath.slice(2))
          : path.resolve(dir, filepath),
      )

      meta = meta.trim()
      lang = lang.trim()
      lang = lang || path.extname(filepath).slice(1)

      const isAFile = fs.statSync(src).isFile()
      if (!fs.existsSync(src) || !isAFile) {
        throw new Error(isAFile
          ? `Code snippet path not found: ${src}`
          : `Invalid code snippet option`)
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

      if (meta.match(reMonacoWrite)) {
        monacoWriterWhitelist.add(filepath)
        lang = lang.trim()
        meta = meta.replace(reMonacoWrite, '').trim() || '{}'
        const encoded = lz.compressToBase64(content)
        return `<Monaco writable=${JSON.stringify(filepath)} code-lz="${encoded}" lang="${lang}" v-bind="${meta}" />`
      }
      else {
        watchFiles[src] ??= new Set()
        watchFiles[src].add(slide.index)
      }

      return `\`\`\`${lang} ${meta}\n${content}\n\`\`\``
    },
  )
}
