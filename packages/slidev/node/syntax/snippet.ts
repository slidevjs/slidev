import type { ResolvedSlidevOptions, SlideInfo } from '@slidev/types'
import type { MarkdownExit } from 'markdown-exit'
import fs from 'node:fs'
import { slash } from '@antfu/utils'
import { yellow } from 'ansis'
import lz from 'lz-string'
import path from 'pathe'
import { isPathInsideRoots } from '../utils'
import { regexSlideSourceId } from '../vite/common'
import { monacoWriterWhitelist } from '../vite/monacoWrite'

const RE_NEWLINE = /\r?\n/

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
export const RE_SNIPPET_IMPORT = /^<<<[ \t]*(\S.*?)(#[\w\-=;*!]+)?[ \t]*(?:[ \t](\S+?))?[ \t]*(\{.*)?$/

export function resolveSnippetImport(lineText: string, userRoot: string, slide: SlideInfo, allowedRoots: string[] = [userRoot]) {
  const match = lineText.trimStart().match(RE_SNIPPET_IMPORT)
  if (!match)
    return null

  let [, filepath = '', regionName = '', lang = '', meta = ''] = match
  const dir = path.dirname(slide.source.filepath)
  const src = slash(
    filepath.startsWith('@/')
      ? path.resolve(userRoot, filepath.slice(2))
      : path.resolve(dir, filepath),
  )

  lang = lang.trim() || path.extname(filepath).slice(1)
  meta = meta.trim()

  if (!isPathInsideRoots(src, allowedRoots)) {
    throw new Error(`Code snippet path escapes the project root: ${src}`)
  }

  const isAFile = fs.existsSync(src) && fs.statSync(src).isFile()
  if (!isAFile) {
    throw new Error(`Code snippet path not found: ${src}`)
  }

  let content = fs.readFileSync(src, 'utf8')

  if (regionName) {
    const lines = content.split(RE_NEWLINE)

    if (regionName.startsWith('#tag=') || regionName.startsWith('#tags=')) {
      let incTags: Record<string, boolean> | null = null
      if (regionName.startsWith('#tag=')) {
        const tag = regionName.slice('#tag='.length)
        if (tag && tag !== '!') {
          incTags = tag.startsWith('!')
            ? { [tag.slice(1)]: false }
            : { [tag]: true }
        }
      }
      else if (regionName.startsWith('#tags=')) {
        const tags = regionName.slice('#tags='.length).split(';')
        incTags = {}
        for (const tag of tags) {
          if (tag && tag !== '!') {
            incTags[tag.startsWith('!') ? tag.slice(1) : tag] = !tag.startsWith('!')
          }
        }
        if (Object.keys(incTags).length === 0) {
          incTags = null
        }
      }

      if (incTags) {
        const includedLines = filterLinesByTags(lines, incTags, src)
        content = dedent(includedLines.join('\n'))
      }
    }
    else {
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
  }

  return { content, filepath, lang, meta, src }
}

const TAG_DIRECTIVE_RE = /\b(?:tag|(e)nd)::(\S+?)\[\](?=$|[ \r])/m

// The code of this function is an almost identical rewrite of the code of AsciidoctorJS:
// https://github.com/asciidoctor/asciidoctor.js/blob/07c162c987ef6284274cb95fb01a0357b150d4c4/packages/core/src/reader.js#L1658
function filterLinesByTags(lines: ReadonlyArray<string>, incTags: Record<string, boolean>, sourceFile: string): ReadonlyArray<string> {
  const tags = { ...incTags }
  let select: boolean | undefined
  let baseSelect: boolean | undefined
  let wildcard: boolean | undefined
  if ('**' in tags) {
    select = baseSelect = tags['**']
    delete tags['**']
    if ('*' in tags) {
      wildcard = tags['*']
      delete tags['*']
    }
    else if (!select && Object.values(tags)[0] === false) {
      wildcard = true
    }
  }
  else if ('*' in tags) {
    if (Object.keys(tags)[0] === '*') {
      select = baseSelect = !(wildcard = tags['*'])
    }
    else {
      select = baseSelect = false
      wildcard = tags['*']
    }
    delete tags['*']
  }
  else {
    select = baseSelect = !Object.values(tags).includes(true)
  }

  const includedLines: Array<string> = []
  const tagStack: Array<{
    tag: string
    select: boolean
    lineNumber: number
  }> = []
  const tagsSelected = new Set<string>()
  let activeTag: string | null = null

  for (let idx = 0; idx < lines.length; idx++) {
    const lineNumber = idx + 1
    const line = lines[idx]
    if (line.includes('::') && line.includes('[]')) {
      const tagDirectiveResult = TAG_DIRECTIVE_RE.exec(line)
      if (tagDirectiveResult) {
        const [, isEnd, thisTag] = tagDirectiveResult
        if (isEnd) {
          if (thisTag === activeTag) {
            tagStack.pop()
            if (tagStack.length === 0) {
              activeTag = null
              select = baseSelect
            }
            else {
              activeTag = tagStack[tagStack.length - 1].tag
              select = tagStack[tagStack.length - 1].select
            }
          }
          else if (thisTag in tags) {
            const si = tagStack.findLastIndex(({ tag }) => tag === thisTag)
            if (si >= 0) {
              tagStack.splice(si, 1)
              console.warn(`mismatched end tag (expected '${activeTag}' but found '${thisTag}') at line ${lineNumber} of file ${sourceFile}`)
            }
            else {
              console.warn(`unexpected end tag '${thisTag}' at line ${lineNumber} of file ${sourceFile}`)
            }
          }
        }
        else if (thisTag in tags) {
          select = tags[thisTag]
          if (select) {
            tagsSelected.add(thisTag)
          }
          activeTag = thisTag
          tagStack.push({ tag: activeTag, select, lineNumber })
        }
        else if (wildcard !== undefined) {
          select = activeTag && !select ? false : wildcard
          activeTag = thisTag
          tagStack.push({ tag: thisTag, select, lineNumber })
        }
        continue
      }
    }
    if (select) {
      includedLines.push(line)
    }
  }

  for (const stackElement of tagStack) {
    console.warn(
      `detected unclosed tag '${stackElement.tag}' starting at line ${stackElement.lineNumber} of file ${sourceFile}`,
    )
  }

  const missingTags = Object.entries(tags)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .filter(k => !tagsSelected.has(k))
  if (missingTags.length > 0) {
    console.warn(`tag${missingTags.length > 1 ? 's' : ''} '${missingTags.join(', ')}' not found in file ${sourceFile}`)
  }

  return includedLines
}

export default function MarkdownItSnippet(md: MarkdownExit, { userRoot, userWorkspaceRoot, roots, data: { watchFiles, slides } }: ResolvedSlidevOptions) {
  const allowedRoots = [...new Set([userWorkspaceRoot, userRoot, ...(roots ?? [])].filter(Boolean))]
  md.block.ruler.before('fence', 'snippet_import', (state, startLine, _endLine, silent) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]

    const lineText = state.src.slice(pos, max)
    const match = lineText.match(RE_SNIPPET_IMPORT)

    if (!match)
      return false
    if (silent)
      return true

    const slideNo = state.env.id?.match(regexSlideSourceId)
    const slide = slideNo ? slides[slideNo[1] - 1] : null

    if (!slide) {
      console.warn(yellow(`[markdown-it-snippet] Snippet syntax is not supported in ${state.env.id || 'unknown source'}. Skipped.`))
      return false
    }

    const snippet = resolveSnippetImport(lineText, userRoot, slide, allowedRoots)
    if (!snippet)
      return false

    const { content, src } = snippet
    let { lang, meta } = snippet

    if (meta.includes('{monaco-write}')) {
      // The writer resolves whatever it receives against `userRoot`, so hand it
      // a userRoot-relative path. `filepath` is the raw specifier as typed, and
      // an `@/` alias or a path relative to the slide resolves elsewhere for
      // reading than it would for writing.
      const writePath = slash(path.relative(userRoot, src))
      monacoWriterWhitelist.add(writePath)
      lang = lang.trim()
      meta = meta.replace('{monaco-write}', '').trim() || '{}'
      const safeFilepath = JSON.stringify(writePath).slice(1, -1)
      const encoded = lz.compressToBase64(content)

      const token = state.push('html_block', '', 0)
      token.content = `<Monaco writable="${safeFilepath}" code-lz="${encoded}" lang="${lang}" v-bind="${meta}" />\n`
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
