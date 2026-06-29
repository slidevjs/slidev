/**
 * markdown-it plugin for Typst math rendering via the official Typst compiler
 * (using @myriaddreamin/typst-ts-node-compiler, which wraps the real Typst Rust
 * implementation compiled to a native Node.js addon via NAPI-RS).
 *
 * Supports:
 *   - Inline math:  $expr$
 *   - Block math:   $$ ... $$   or   $$ {ranges} ... $$
 *
 * Rendering is done at build time (Node.js / Vite transform), outputting
 * MathML that browsers render natively — no client-side JS required.
 *
 * The inline/block parser rules are reused verbatim from katex.ts since the
 * $...$ / $$...$$ delimiter syntax is the same; only the renderer changes.
 */

import type { MarkdownExit, Token } from 'markdown-exit'
import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler'
import { escapeVueInCode, normalizeRangeStr } from './utils'

const RE_TYPST_BLOCK_INFO = /^\{([\w*,|-]+)\}\s*(\{[^}]*\})?/

// ---------------------------------------------------------------------------
// Shared delimiter parser (identical to katex.ts)
// ---------------------------------------------------------------------------

function isValidDelim(state: any, pos: number) {
  const max = state.posMax
  let can_open = true
  let can_close = true

  const prevChar = pos > 0 ? state.src.charCodeAt(pos - 1) : -1
  const nextChar = pos + 1 <= max ? state.src.charCodeAt(pos + 1) : -1

  if (
    prevChar === 0x20 /* " " */
    || prevChar === 0x09 /* \t */
    || (nextChar >= 0x30 /* "0" */ && nextChar <= 0x39) /* "9" */
  )
    can_close = false

  if (nextChar === 0x20 /* " " */ || nextChar === 0x09 /* \t */)
    can_open = false

  return { can_open, can_close }
}

function math_inline(state: any, silent: boolean) {
  if (state.src[state.pos] !== '$')
    return false

  const res = isValidDelim(state, state.pos)
  if (!res.can_open) {
    if (!silent)
      state.pending += '$'
    state.pos += 1
    return true
  }

  const start = state.pos + 1
  let match = start
  // eslint-disable-next-line no-cond-assign
  while ((match = state.src.indexOf('$', match)) !== -1) {
    let pos = match - 1
    while (state.src[pos] === '\\') pos -= 1
    if (((match - pos) % 2) === 1)
      break
    match += 1
  }

  if (match === -1) {
    if (!silent)
      state.pending += '$'
    state.pos = start
    return true
  }

  if (match - start === 0) {
    if (!silent)
      state.pending += '$$'
    state.pos = start + 1
    return true
  }

  const res2 = isValidDelim(state, match)
  if (!res2.can_close) {
    if (!silent)
      state.pending += '$'
    state.pos = start
    return true
  }

  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.markup = '$'
    token.content = state.src.slice(start, match)
  }

  state.pos = match + 1
  return true
}

function math_block(state: any, start: number, end: number, silent: boolean) {
  let firstLine: string
  let lastLine: string | undefined
  let next: number
  let lastPos: number
  let found = false
  let pos = state.bMarks[start] + state.tShift[start]
  let max = state.eMarks[start]

  if (pos + 2 > max)
    return false
  if (state.src.slice(pos, pos + 2) !== '$$')
    return false

  pos += 2
  firstLine = state.src.slice(pos, max).trim()

  if (silent)
    return true

  let singleLine = false
  if (firstLine.slice(-2) === '$$') {
    firstLine = firstLine.slice(0, -2).trim()
    found = true
    singleLine = true
  }

  for (next = start; !found;) {
    next++
    if (next >= end)
      break

    pos = state.bMarks[next] + state.tShift[next]
    max = state.eMarks[next]

    if (pos < max && state.tShift[next] < state.blkIndent)
      break

    if (state.src.slice(pos, max).trim().slice(-2) === '$$') {
      lastPos = state.src.slice(0, max).lastIndexOf('$$')
      lastLine = state.src.slice(pos, lastPos)
      found = true
    }
  }

  state.line = next + 1

  const token = state.push('math_block', 'math', 0)
  token.block = true

  if (singleLine) {
    token.content = firstLine
  }
  else {
    token.info = firstLine
    token.content = state.getLines(start + 1, next, state.tShift[start], true)
      + (lastLine && lastLine.trim() ? lastLine : '')
  }

  token.map = [start, state.line]
  token.markup = '$$'
  return true
}

// ---------------------------------------------------------------------------
// Typst compiler singleton — one instance for the entire build
// ---------------------------------------------------------------------------

let _compiler: InstanceType<typeof NodeCompiler> | null = null

function getCompiler(): InstanceType<typeof NodeCompiler> {
  if (!_compiler)
    _compiler = NodeCompiler.create()
  return _compiler
}

/**
 * Extract just the <math ...>...</math> fragment from Typst's HTML output.
 * The body() method wraps content in a <div>; inside we expect either:
 *   - inline: <p><math>...</math></p>
 *   - block:  <math display="block">...</math>
 */
function extractMathFragment(body: string, displayMode: boolean): string {
  // Strip surrounding whitespace
  const trimmed = body.trim()

  if (displayMode) {
    // Block math: <div>\n  <math display="block">...</math>\n</div>
    const m = trimmed.match(/<math\b[^>]*>([\s\S]*?)<\/math>/)
    if (m) {
      // Reconstruct the full <math> tag including attributes
      const attrM = trimmed.match(/<(math\b[^>]*)>/)
      return `<math ${attrM ? attrM[1].slice(4) : 'display="block"'}>`.replace(/<math  *>/, '<math display="block">').concat(m[1], '</math>')
    }
    return trimmed
  }
  else {
    // Inline math: <div><p><math>...</math></p></div>
    const m = trimmed.match(/<math\b[^>]*>[\s\S]*?<\/math>/)
    return m ? m[0] : trimmed
  }
}

/**
 * Render a single Typst math expression to a MathML HTML fragment.
 * Uses the shared NodeCompiler instance (no subprocess overhead).
 */
function renderTypstMath(content: string, displayMode: boolean): string {
  const compiler = getCompiler()

  // Typst block math uses $ ... $ (with whitespace = display mode).
  // We always wrap in display/inline form ourselves.
  const source = displayMode ? `$ ${content} $` : `$${content}$`

  const result = compiler.tryHtml({ mainFileContent: source })

  if (result.hasError()) {
    // Return error placeholder that's visible but doesn't break the slide
    const escaped = content.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<span class="typst-math-error" title="Typst math error">${escaped}</span>`
  }

  const body = result.result!.body()
  return escapeVueInCode(extractMathFragment(body, displayMode))
}

// ---------------------------------------------------------------------------
// CSS — extracted once from Typst and baked in as a constant
// ---------------------------------------------------------------------------

/**
 * The MathML CSS that Typst emits with every HTML document.
 * It is identical regardless of the expression content, so we extract it
 * once at module load time and expose it for the virtual CSS module.
 */
let _typstMathCss: string | null = null

export function getTypstMathCss(): string {
  if (_typstMathCss !== null)
    return _typstMathCss

  const compiler = getCompiler()
  const result = compiler.tryHtml({ mainFileContent: '$x$' })
  if (result.hasError() || !result.result) {
    _typstMathCss = ''
    return _typstMathCss
  }
  const html = result.result.html()
  const m = html.match(/<style>([\s\S]*?)<\/style>/)
  _typstMathCss = m ? m[1] : ''
  return _typstMathCss
}

// ---------------------------------------------------------------------------
// markdown-it plugin
// ---------------------------------------------------------------------------

export default function MarkdownItTypstMath(md: MarkdownExit) {
  const inlineRenderer = (tokens: any[], idx: number) => {
    return renderTypstMath(tokens[idx].content, false)
  }

  const blockRenderer = (tokens: Token[], idx: number) => {
    const token = tokens[idx]
    const [, rangeStr, optionsProp] = RE_TYPST_BLOCK_INFO.exec(token.info) || []
    const ranges = normalizeRangeStr(rangeStr)
    const optionsAttr = optionsProp ? `v-bind="${optionsProp}"` : ''
    const mathHtml = renderTypstMath(token.content, true)
    // Reuse KaTexBlockWrapper for click-based line highlighting when ranges are
    // specified. The wrapper only needs to toggle CSS classes on children;
    // for MathML we target <mtr> rows inside <mtable> (aligned equations).
    // When no ranges are given, emit the raw MathML directly.
    if (ranges.length > 0) {
      return `<KaTexBlockWrapper ${optionsAttr} :ranges='${JSON.stringify(ranges)}'>${mathHtml}</KaTexBlockWrapper>\n`
    }
    return `${mathHtml}\n`
  }

  md.inline.ruler.after('escape', 'math_inline', math_inline)
  md.block.ruler.after('blockquote', 'math_block', math_block, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })
  md.renderer.rules.math_inline = inlineRenderer
  md.renderer.rules.math_block = blockRenderer
}
