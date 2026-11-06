import type { NOTE_SHIKI_THEMES } from './note-highlight'
import { describe, expect, it } from 'vitest'
import { createNoteHighlight } from './note-highlight'

// Minimal stand-in for a Shiki highlighter; keeps the test independent of
// theme/language bundles while still asserting the callback contract.
function stubHighlighter() {
  return {
    codeToHtml(code: string, options: { lang: string, themes: typeof NOTE_SHIKI_THEMES }) {
      return `<pre class="shiki" data-lang="${options.lang}" data-light="${options.themes.light}" data-dark="${options.themes.dark}">${code}</pre>`
    },
  }
}

describe('createNoteHighlight', () => {
  it('passes the code and language to Shiki', () => {
    const highlight = createNoteHighlight(stubHighlighter())
    const html = highlight('const x = 1', 'ts')
    expect(html).toContain('data-lang="ts"')
    expect(html).toContain('const x = 1')
  })

  it('uses the github-light/github-dark theme pair', () => {
    const highlight = createNoteHighlight(stubHighlighter())
    const html = highlight('body {}', 'css')
    expect(html).toContain('data-light="github-light"')
    expect(html).toContain('data-dark="github-dark"')
  })

  it('falls back to an escaped code block without a language', () => {
    const highlight = createNoteHighlight(stubHighlighter())
    expect(highlight('<script>', '')).toBe('<pre><code>&lt;script&gt;</code></pre>')
  })

  it('falls back to an escaped code block when highlighting throws', () => {
    const highlight = createNoteHighlight({
      codeToHtml() {
        throw new Error('unknown language')
      },
    })
    expect(highlight('<b>x</b>', 'unknown')).toBe('<pre><code class="language-unknown">&lt;b&gt;x&lt;/b&gt;</code></pre>')
  })
})
