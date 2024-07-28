// Ported from https://github.com/vuejs/vitepress/blob/main/src/node/markdown/plugins/snippet.ts

import path from 'node:path'
import lz from 'lz-string'
import fs from 'fs-extra'
import type { MarkdownTransformContext } from '@slidev/types'
import { slash } from '@antfu/utils'
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

function testLine(
  line: string,
  regexp: RegExp,
  regionName: string,
  end: boolean = false,
) {
  const [full, tag, name] = regexp.exec(line.trim()) || []

  return (
    full
    && tag
    && name === regionName
    && tag.match(end ? /^[Ee]nd ?[rR]egion$/ : /^[rR]egion$/)
  )
}

function findRegion(lines: Array<string>, regionName: string) {
  const regionRegexps = [
    /^\/\/ ?#?((?:end)?region) ([\w*-]+)$/, // javascript, typescript, java
    /^\/\* ?#((?:end)?region) ([\w*-]+) ?\*\/$/, // css, less, scss
    /^#pragma ((?:end)?region) ([\w*-]+)$/, // C, C++
    /^<!-- #?((?:end)?region) ([\w*-]+) -->$/, // HTML, markdown
    /^#(End Region) ([\w*-]+)$/, // Visual Basic
    /^::#(endregion) ([\w*-]+)$/, // Bat
    /^# ?((?:end)?region) ([\w*-]+)$/, // C#, PHP, Powershell, Python, perl & misc
  ]

  let regexp = null
  let start = -1

  for (const [lineId, line] of lines.entries()) {
    if (regexp === null) {
      for (const reg of regionRegexps) {
        if (testLine(line, reg, regionName)) {
          start = lineId + 1
          regexp = reg
          break
        }
      }
    }
    else if (testLine(line, regexp, regionName, true)) {
      return { start, end: lineId, regexp }
    }
  }

  return null
}

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
    /^<<<\s*(\S.*?)(#[\w-]+)?\s*(?:\s(\S+?))?\s*(\{.*)?$/gm,
    (full, filepath = '', regionName = '', lang = '', meta = '') => {
      const src = slash(
        /^@\//.test(filepath)
          ? path.resolve(options.userRoot, filepath.slice(2))
          : path.resolve(dir, filepath),
      )

      watchFiles[src] ??= new Set()
      watchFiles[src].add(slide.index)

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
              .filter(line => !region.regexp.test(line.trim()))
              .join('\n'),
          )
        }
      }

      meta = meta.trim()
      lang = lang.trim()
      lang = lang || path.extname(filepath).slice(1)

      if (meta.match(/^\{monaco-write\}/)) {
        monacoWriterWhitelist.add(filepath)
        lang = lang.trim()
        meta = meta.replace(/^\{monaco-write\}/, '').trim() || '{}'
        const encoded = lz.compressToBase64(content)
        return `<Monaco writable=${JSON.stringify(filepath)} code-lz="${encoded}" lang="${lang}" v-bind="${meta}" />`
      }

      return `\`\`\`${lang} ${meta}\n${content}\n\`\`\``
    },
  )
}
