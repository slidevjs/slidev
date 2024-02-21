// Ported from https://github.com/vuejs/vitepress/blob/main/src/node/markdown/plugins/snippet.ts

import path from 'node:path'
import fs from 'fs-extra'
import type { ResolvedSlidevOptions } from '../options'

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
    /^#((?:End )Region) ([\w*-]+)$/, // Visual Basic
    /^::#((?:end)region) ([\w*-]+)$/, // Bat
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
export function transformSnippet(md: string, options: ResolvedSlidevOptions, id: string) {
  const slideId = (id as string).match(/(\d+)\.md$/)?.[1]
  if (!slideId)
    return md
  const data = options.data
  const slideInfo = data.slides[+slideId - 1]
  const dir = path.dirname(slideInfo.source?.filepath ?? options.entry ?? options.userRoot)
  return md.replace(
    /^<<< *(.+?)(#[\w-]+)? *(?: (\S+?))? *(\{.*)?$/mg,
    (full, filepath = '', regionName = '', lang = '', meta = '') => {
      const firstLine = `\`\`\`${lang || path.extname(filepath).slice(1)} ${meta}`

      const src = /^\@[\/]/.test(filepath)
        ? path.resolve(options.userRoot, filepath.slice(2))
        : path.resolve(dir, filepath)

      data.watchFiles.push(src)

      const isAFile = fs.statSync(src).isFile()
      if (!fs.existsSync(src) || !isAFile) {
        throw new Error(isAFile
          ? `Code snippet path not found: ${src}`
          : `Invalid code snippet option`)
      }

      let content = fs.readFileSync(src, 'utf8')

      slideInfo.snippetsUsed ??= {}
      slideInfo.snippetsUsed[src] = content

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

      return `${firstLine}\n${content}\n\`\`\``
    },
  )
}
