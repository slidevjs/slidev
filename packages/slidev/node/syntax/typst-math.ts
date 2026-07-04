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

import type { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler'
import type { MarkdownExit, Token } from 'markdown-exit'
import { yellow } from 'ansis'
import { resolve } from 'mlly'
import { escapeVueInCode, normalizeRangeStr } from './utils'

export type TypstCompiler = InstanceType<typeof NodeCompiler>

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
  ) {
    can_close = false
  }

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
// Loading the optional native compiler
// ---------------------------------------------------------------------------

const PACKAGE_NAME = '@myriaddreamin/typst-ts-node-compiler'

/**
 * Dynamically load the (optional) Typst compiler package. It is a native
 * NAPI addon and an optional peer dependency, so it is loaded on demand with
 * the same multi-root resolution strategy used for `playwright-chromium`.
 *
 * Returns a ready-to-use `NodeCompiler` instance, or throws a helpful error
 * instructing the user how to install the package.
 */
export async function loadTypstCompiler(roots: string[] = []): Promise<TypstCompiler> {
  let mod: typeof import('@myriaddreamin/typst-ts-node-compiler') | undefined

  // 1. resolve relative to the user's project roots (theme/addon/user)
  for (const root of roots) {
    try {
      mod = await import(await resolve(PACKAGE_NAME, { url: root }))
      break
    }
    catch {}
  }

  // 2. fall back to the @slidev/cli installation
  if (!mod) {
    try {
      mod = await import(PACKAGE_NAME)
    }
    catch {}
  }

  if (!mod) {
    throw new Error(
      `[slidev] Typst math rendering requires the "${PACKAGE_NAME}" package. `
      + `Install it with \`npm i -D ${PACKAGE_NAME}\` or remove \`mathRenderer: typst\` from your headmatter.`,
    )
  }

  return mod.NodeCompiler.create()
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

// Matches the outermost <math ...>...</math> element, capturing its tag so we
// can keep attributes like `display="block"`. Typst never nests a top-level
// <math> inside another, so a non-greedy match on the first/last is safe.
const RE_MATH_ELEMENT = /<math\b[^>]*>[\s\S]*?<\/math>/

/**
 * Extract the `<math>…</math>` fragment from Typst's full HTML body output.
 *
 * `body()` wraps content in a `<div>`, with inline math additionally wrapped
 * in a `<p>`. We only want the `<math>` element itself (attributes included),
 * which both browsers and Vue render directly.
 */
function extractMathFragment(body: string): string {
  return body.match(RE_MATH_ELEMENT)?.[0] ?? ''
}

/**
 * Format a Typst diagnostic list into a single readable warning string.
 */
function formatDiagnostics(diagnostics: Array<{ message?: string }> | undefined): string {
  if (!diagnostics?.length)
    return 'unknown error'
  return diagnostics.map(d => d.message ?? String(d)).join('\n  ')
}

/**
 * Render a single Typst math expression to a MathML HTML fragment using the
 * shared compiler instance. On error, logs a diagnostic and returns a visible
 * inline error placeholder so the slide keeps building.
 */
function renderTypstMath(compiler: TypstCompiler, content: string, displayMode: boolean): string {
  // Typst uses whitespace inside `$ … $` to mean display (block) mode.
  const source = displayMode ? `$ ${content} $` : `$${content}$`

  const result = compiler.tryHtml({ mainFileContent: source })

  if (result.hasError() || !result.result) {
    const error = result.takeError()
    const detail = formatDiagnostics(error?.shortDiagnostics as Array<{ message?: string }>)
    console.warn(yellow(`[slidev] Failed to render Typst math: ${content}\n  ${detail}`))
    const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<span class="slidev-typst-math-error" title="Typst math error: ${escaped}">${escaped}</span>`
  }

  return escapeVueInCode(extractMathFragment(result.result.body()))
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

/**
 * The MathML CSS that Typst emits with every HTML document is identical
 * regardless of the expression content, so we extract it once and cache it
 * for injection by the conditional-styles virtual module.
 */
const RE_STYLE_ELEMENT = /<style>([\s\S]*?)<\/style>/

export function extractTypstMathCss(compiler: TypstCompiler): string {
  const result = compiler.tryHtml({ mainFileContent: '$x$' })
  if (result.hasError() || !result.result)
    return ''
  return result.result.html().match(RE_STYLE_ELEMENT)?.[1] ?? ''
}

export function resolveTypstMathCss(compiler: TypstCompiler, mathFonts: string[] = []): string {
  const css = extractTypstMathCss(compiler)
  if (mathFonts.length === 0)
    return css
  return `${css}\n.slidev-layout math, .slidev-layout math * { font-family: ${mathFonts.join(', ')}; }`
}

// ---------------------------------------------------------------------------
// markdown-it plugin
// ---------------------------------------------------------------------------

export default function MarkdownItTypstMath(md: MarkdownExit, compiler: TypstCompiler) {
  const inlineRenderer = (tokens: Token[], idx: number) => {
    return renderTypstMath(compiler, tokens[idx].content, false)
  }

  const blockRenderer = (tokens: Token[], idx: number) => {
    const token = tokens[idx]
    const [, rangeStr, optionsProp] = RE_TYPST_BLOCK_INFO.exec(token.info ?? '') || []
    const ranges = normalizeRangeStr(rangeStr)
    const optionsAttr = optionsProp ? `v-bind="${optionsProp}"` : ''
    const mathHtml = renderTypstMath(compiler, token.content, true)
    // When line ranges are specified (`$$ {1|3|all}`), wrap in the Typst block
    // wrapper which toggles highlight classes on the MathML <mtr> rows.
    // Otherwise emit the raw MathML directly.
    if (ranges.length > 0)
      return `<TypstBlockWrapper ${optionsAttr} :ranges='${JSON.stringify(ranges)}'>${mathHtml}</TypstBlockWrapper>\n`
    return `${mathHtml}\n`
  }

  md.inline.ruler.after('escape', 'math_inline', math_inline)
  md.block.ruler.after('blockquote', 'math_block', math_block, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })
  md.renderer.rules.math_inline = inlineRenderer
  md.renderer.rules.math_block = blockRenderer
}
