import type { MarkdownTransformContext } from '@slidev/types'
import { getCodeBlocks, getCommentBlocks } from './utils'

export function transformHtmlListIndent(ctx: MarkdownTransformContext) {
  const linesWithNewline = ctx.s.original.split(/(\r?\n)/g)
  const codeBlocks = getCodeBlocks(ctx.s.original)
  const commentBlocks = getCommentBlocks(ctx.s.original)

  const lines: string[] = []
  for (let i = 0; i < linesWithNewline.length; i += 2) {
    const line = linesWithNewline[i]
    const newline = linesWithNewline[i + 1] || ''
    lines.push(line + newline)
  }

  // precompute line start offsets
  const lineStarts: number[] = []
  let off = 0
  for (const l of lines) {
    lineStarts.push(off)
    off += l.length
  }

  for (let i = 0; i < lines.length; i++) {
    // skip lines inside code or comment blocks
    if (codeBlocks.isLineInsideCodeblocks(i) || commentBlocks.isLineInsideCommentBlocks(i))
      continue

    const line = lines[i]
    // match a single-line opening tag like `<div>` or `<div attr>` (no closing on same line)
    const openMatch = line.match(/^\s*<([A-Za-z][\w-]*)\b[^>]*>\s*$/)
    if (!openMatch)
      continue

    const tag = openMatch[1]
    // ignore void/self-closing tags
    if (/\/\s*>\s*$/.test(line) || /<br\b|<hr\b|<img\b/i.test(line))
      continue

    // find matching closing tag, accounting for nested same tags
    let depth = 1
    let j = i + 1
    for (; j < lines.length; j++) {
      if (codeBlocks.isLineInsideCodeblocks(j) || commentBlocks.isLineInsideCommentBlocks(j))
        continue
      const l = lines[j]
      // opening same tag increases depth
      const openSame = l.match(new RegExp(`^\\s*<${tag}\\b[^>]*>\\s*$`))
      if (openSame) {
        depth++
        continue
      }
      const closeMatch = l.match(new RegExp(`^\\s*</${tag}\\s*>\\s*$`))
      if (closeMatch) {
        depth--
        if (depth === 0)
          break
      }
    }

    if (j >= lines.length)
      continue

    // lines inside the HTML block are (i+1) .. (j-1)
    for (let k = i + 1; k < j; k++) {
      if (codeBlocks.isLineInsideCodeblocks(k) || commentBlocks.isLineInsideCommentBlocks(k))
        continue
      const content = lines[k]
      // match list markers at start of line with no leading spaces
      const listMatch = content.match(/^([ \t]*)([-*+]|\d+\.)\s+/)
      if (!listMatch)
        continue
      const leading = listMatch[1]
      const marker = listMatch[2]
      // if there is no or insufficient indentation (we expect at least two spaces inside HTML), add two spaces
      if (leading.length === 0) {
        const insertAt = lineStarts[k]
        ctx.s.prependLeft(insertAt, '  ')
      }
    }

    // continue scanning after the end tag
    i = j
  }
}
import type { MarkdownTransformContext } from '@slidev/types'
import { getCodeBlocks, getCommentBlocks } from './utils'

export function transformHtmlListIndent(ctx: MarkdownTransformContext) {
  const original = ctx.s.original
  const lines = original.split(/(\r?\n)/g)

  // rebuild logical lines (line + newline)
  const logical: string[] = []
  for (let i = 0; i < lines.length; i += 2) {
    const line = lines[i] || ''
    const newline = lines[i + 1] || ''
    logical.push(line + newline)
  }

  const codeBlocks = getCodeBlocks(original)
  const commentBlocks = getCommentBlocks(original)

  let inHtml = false
  let currentTag = ''

  for (let i = 0; i < logical.length; i++) {
    // skip lines inside code or comment blocks
    if (codeBlocks.isLineInsideCodeblocks(i) || commentBlocks.isLineInsideCommentBlocks(i))
      continue

    const line = logical[i]

    const openMatch = line.match(/^\s*<([A-Za-z][\w-]*)\b[^>]*>\s*$/)
    const closeMatch = line.match(/^\s*<\/(\w[\w-]*)>\s*$/)

    if (openMatch) {
      inHtml = true
      currentTag = openMatch[1]
      continue
    }

    if (inHtml && closeMatch && closeMatch[1] === currentTag) {
      inHtml = false
      currentTag = ''
      continue
    }

    if (inHtml) {
      // If a top-level list marker (no leading spaces) is found, indent it by two spaces
      const listMatch = line.match(/^([ \t]*)([-*+]\s+)/)
      if (listMatch) {
        const leading = listMatch[1]
        const marker = listMatch[2]
        // if there's no indentation (or only tabs), ensure at least two spaces
        if (!leading || leading.replace(/\t/g, '    ').length === 0) {
          const startPos = logical.slice(0, i).join('').length
          const endPos = startPos + line.length
          const newLine = '  ' + line
          ctx.s.overwrite(startPos, endPos, newLine)
          // update logical content so subsequent offsets align
          logical[i] = newLine
        }
      }
    }
  }
}
import type { MarkdownTransformContext } from '@slidev/types'
import { getCodeBlocks, getCommentBlocks } from './utils'

export function transformHtmlListIndent(ctx: MarkdownTransformContext) {
  const linesWithNewline = ctx.s.original.split(/(\r?\n)/g)
  const codeBlocks = getCodeBlocks(ctx.s.original)
  const commentBlocks = getCommentBlocks(ctx.s.original)

  const lines: string[] = []
  for (let i = 0; i < linesWithNewline.length; i += 2) {
    const line = linesWithNewline[i]
    const newline = linesWithNewline[i + 1] || ''
    lines.push(line + newline)
  }

  let offset = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const start = offset
    offset += line.length

    if (codeBlocks.isLineInsideCodeblocks(i) || commentBlocks.isLineInsideCommentBlocks(i))
      continue

    const openMatch = line.match(/^\s*<([A-Za-z][\w-]*)\b[^>]*>\s*$/)
    if (!openMatch)
      continue

    // skip self-closing tags
    if (line.trimEnd().endsWith('/>'))
      continue

    const tag = openMatch[1]

    // find closing tag line index
    let j = i + 1
    let innerOffset = offset
    for (; j < lines.length; j++) {
      if (codeBlocks.isLineInsideCodeblocks(j) || commentBlocks.isLineInsideCommentBlocks(j)) {
        innerOffset += lines[j].length
        continue
      }
      const closeRegex = new RegExp(`^\\s*<\\/${tag}\\b[^>]*>\\s*$`)
      if (closeRegex.test(lines[j]))
        break
      innerOffset += lines[j].length
    }

    if (j >= lines.length)
      continue

    // indent list lines inside the tag if they start without indentation
    let pos = offset // start of first inner line
    for (let k = i + 1; k < j; k++) {
      const innerLine = lines[k]
      const leading = innerLine.match(/^( *)/)
      const leadingSpaces = leading ? leading[1].length : 0
      // skip code/comment lines
      if (codeBlocks.isLineInsideCodeblocks(k) || commentBlocks.isLineInsideCommentBlocks(k)) {
        pos += innerLine.length
        continue
      }
      // list item without indentation (starts at column 0 or only with newlines)
      if (/^\s*([-*+]|(\d+)\.)\s+/.test(innerLine) && leadingSpaces === 0) {
        // insert two spaces at pos
        ctx.s.overwrite(pos, pos, '  ')
        pos += 2
      }
      pos += innerLine.length
    }
  }
}
