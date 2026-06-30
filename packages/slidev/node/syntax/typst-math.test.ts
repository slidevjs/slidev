import type { TypstCompiler } from './typst-math'
import MarkdownExit from 'markdown-exit'
import { beforeAll, describe, expect, it } from 'vitest'
import MarkdownItTypstMath, { extractTypstMathCss, loadTypstCompiler } from './typst-math'

let compiler: TypstCompiler

beforeAll(async () => {
  compiler = await loadTypstCompiler()
})

function createMd() {
  const md = MarkdownExit({ html: true })
  md.use(MarkdownItTypstMath, compiler)
  return md
}

describe('typst math', () => {
  it('renders inline math as MathML without a display attribute', () => {
    const result = createMd().render('value $a^2 + b^2$ here')
    // Inline math should be a bare <math> (no display="block") inside the paragraph
    expect(result).toContain('<math>')
    expect(result).not.toContain('<math display="block">')
    expect(result).toContain('<msup>')
    // Surrounding text is preserved
    expect(result).toContain('value ')
    expect(result).toContain(' here')
  })

  it('renders block math as display MathML', () => {
    const result = createMd().render('$$\nx = 1\n$$')
    expect(result).toContain('<math display="block">')
    expect(result).not.toContain('<TypstBlockWrapper')
  })

  it('wraps block math with ranges in TypstBlockWrapper', () => {
    const result = createMd().render('$$ {1|2}\na &= b \\\nc &= d\n$$')
    expect(result).toContain('<TypstBlockWrapper')
    expect(result).toContain(`:ranges='["1","2"]'`)
    // Aligned multi-line equations become a multiline-equation table with one <mtr> per line
    expect(result).toContain('multiline-equation')
    expect((result.match(/<mtr>/g) || []).length).toBe(2)
  })

  it('does not transform math in a code block', () => {
    const result = createMd().render('```\n$$x^2$$\n```')
    expect(result).toContain('<pre><code>$$x^2$$')
    expect(result).not.toContain('<math')
  })

  it('emits a visible error placeholder on invalid math instead of throwing', () => {
    // `infty` is not a Typst symbol (it is `infinity`)
    const result = createMd().render('$integral_0^infty x$')
    expect(result).toContain('slidev-typst-math-error')
    expect(result).toContain('integral_0^infty x')
    expect(result).not.toContain('<math')
  })

  it('escapes Vue interpolation in rendered output', () => {
    // The rendered MathML must not contain raw `{{` that Vue would interpret
    const result = createMd().render('$a$')
    expect(result).not.toContain('{{')
  })

  it('extracts the Typst MathML stylesheet', () => {
    const css = extractTypstMathCss(compiler)
    expect(css).toContain('mtable')
    expect(css).toContain('mfrac')
  })
})
