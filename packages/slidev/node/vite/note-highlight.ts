/** Shiki theme pair used for note code blocks. */
export const NOTE_SHIKI_THEMES = {
  light: 'github-light',
  dark: 'github-dark',
} as const

/** Languages pre-loaded for note code blocks. */
export const NOTE_SHIKI_LANGS = [
  'css',
  'ts',
  'typescript',
  'kotlin',
  'html',
  'go',
  'js',
  'javascript',
  'json',
  'bash',
  'md',
  'vue',
  'python',
  'rust',
  'java',
  'c',
  'cpp',
  'yaml',
  'toml',
  'sql',
  'diff',
  'markdown',
]

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Build the Markdown highlight callback used for presenter notes.
 * Falls back to a plain (escaped) code block when highlighting fails.
 */
export function createNoteHighlight(highlighter: {
  codeToHtml: (code: string, options: { lang: string, themes: typeof NOTE_SHIKI_THEMES }) => string
}) {
  return (str: string, lang: string): string => {
    if (!lang)
      return `<pre><code>${escapeHtml(str)}</code></pre>`
    try {
      return highlighter.codeToHtml(str, { lang, themes: NOTE_SHIKI_THEMES })
    }
    catch {
      return `<pre><code class="language-${lang}">${escapeHtml(str)}</code></pre>`
    }
  }
}
