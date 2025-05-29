// Markdown-it plugin for Typst formula rendering

/* Process inline math */
/*
Similar to markdown-it-katex, but uses Typst.ts for rendering
*/

import type { TypstSetup } from '@slidev/types'

// Test if potential opening or closing delimiter
// Assumes that there is a "$" at state.src[pos]
function isValidDelim(state: any, pos: number) {
  const max = state.posMax
  let can_open = true
  let can_close = true

  const prevChar = pos > 0 ? state.src.charCodeAt(pos - 1) : -1
  const nextChar = pos + 1 <= max ? state.src.charCodeAt(pos + 1) : -1

  // Check non-whitespace conditions for opening and closing, and
  // check that closing delimeter isn't followed by a number
  if (prevChar === 0x20/* " " */ || prevChar === 0x09 ||/* \t */ (nextChar >= 0x30/* "0" */ && nextChar <= 0x39/* "9" */))
    can_close = false

  if (nextChar === 0x20/* " " */ || nextChar === 0x09/* \t */)
    can_open = false

  return {
    can_open,
    can_close,
  }
}

function math_inline(state: any, silent: boolean) {
  let match, token, res, pos

  if (state.src[state.pos] !== '$')
    return false

  res = isValidDelim(state, state.pos)
  if (!res.can_open) {
    if (!silent)
      state.pending += '$'
    state.pos += 1
    return true
  }

  // First check for and bypass all properly escaped delimiters
  // This loop will assume that the first leading backtick can not
  // be the first character in state.src, which is known since
  // we have found an opening delimiter already.
  const start = state.pos + 1
  match = start
  // eslint-disable-next-line no-cond-assign
  while ((match = state.src.indexOf('$', match)) !== -1) {
    // Found potential $, look for escapes, pos will point to
    // first non escape when complete
    pos = match - 1
    while (state.src[pos] === '\\') pos -= 1

    // Even number of escapes, potential closing delimiter found
    if (((match - pos) % 2) === 1)
      break
    match += 1
  }

  // No closing delimter found.  Consume $ and continue.
  if (match === -1) {
    if (!silent)
      state.pending += '$'
    state.pos = start
    return true
  }

  // Check if we have empty content, ie: $$.  Do not parse.
  if (match - start === 0) {
    if (!silent)
      state.pending += '$$'
    state.pos = start + 1
    return true
  }

  // Check for valid closing delimiter
  res = isValidDelim(state, match)
  if (!res.can_close) {
    if (!silent)
      state.pending += '$'
    state.pos = start
    return true
  }

  if (!silent) {
    token = state.push('typst_inline', 'typst', 0)
    token.markup = '$'
    token.content = state.src.slice(start, match)
  }

  state.pos = match + 1
  return true
}

function math_block(state: any, start: number, end: number, silent: boolean) {
  let firstLine
  let lastLine
  let next
  let lastPos
  let found = false
  let pos = state.bMarks[start] + state.tShift[start]
  let max = state.eMarks[start]

  if (pos + 2 > max)
    return false
  if (state.src.slice(pos, pos + 2) !== '$$')
    return false

  pos += 2
  firstLine = state.src.slice(pos, max)

  if (silent)
    return true
  if (firstLine.trim().slice(-2) === '$$') {
    // Single line expression
    firstLine = firstLine.trim().slice(0, -2)
    found = true
  }

  for (next = start; !found;) {
    next++

    if (next >= end)
      break

    pos = state.bMarks[next] + state.tShift[next]
    max = state.eMarks[next]

    if (pos < max && state.tShift[next] < state.blkIndent) {
      // non-empty line with negative indent should stop the list:
      break
    }

    if (state.src.slice(pos, max).trim().slice(-2) === '$$') {
      lastPos = state.src.slice(0, max).lastIndexOf('$$')
      lastLine = state.src.slice(pos, lastPos)
      found = true
    }
  }

  state.line = next + 1

  const token = state.push('typst_block', 'typst', 0)
  token.block = true
  token.content = (firstLine && firstLine.trim() ? `${firstLine}\n` : '')
    + state.getLines(start + 1, next, state.tShift[start], true)
    + (lastLine && lastLine.trim() ? lastLine : '')
  token.map = [start, state.line]
  token.markup = '$$'
  return true
}

export default function MarkdownItTypst(md: any, options: Record<string, any>) {
  // set Typst.ts as the renderer for math
  const typstInline = function (latex: string) {
    try {
      // Here we would use Typst.ts to render the formula
      // For now, we'll just wrap it in a span with a data attribute
      return `<span class="typst-inline" data-typst="${encodeURIComponent(latex)}">${latex}</span>`
    }
    catch (error) {
      if (options.throwOnError)
        console.warn(error)
      return latex
    }
  }

  const inlineRenderer = function (tokens: any, idx: number) {
    return typstInline(tokens[idx].content)
  }

  const typstBlock = function (latex: string) {
    try {
      // Here we would use Typst.ts to render the formula
      // For now, we'll just wrap it in a div with a data attribute
      return `<div class="typst-block" data-typst="${encodeURIComponent(latex)}">${latex}</div>`
    }
    catch (error) {
      if (options.throwOnError)
        console.warn(error)
      return latex
    }
  }

  const blockRenderer = function (tokens: any, idx: number) {
    return `${typstBlock(tokens[idx].content)}\n`
  }

  md.inline.ruler.after('escape', 'typst_inline', math_inline)
  md.block.ruler.after('blockquote', 'typst_block', math_block, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })
  md.renderer.rules.typst_inline = inlineRenderer
  md.renderer.rules.typst_block = blockRenderer
}