import type { ShikiDarkModeThemes } from 'packages/types'
import type { IShikiTheme, IThemeRegistration, Highlighter as ShikiHighlighter, Theme } from 'shiki'
import type MarkdownIt from 'markdown-it'
import type { ResolvedShikiOptions, ShikiOptions } from '@slidev/types'
import { escapeVueInCode } from './markdown'

function getThemeName(theme: IThemeRegistration | string) {
  if (typeof theme === 'string')
    return theme as Theme
  return (theme as IShikiTheme).name
}

function isShikiDarkModeThemes(theme: IThemeRegistration | ShikiDarkModeThemes): theme is ShikiDarkModeThemes {
  return typeof theme === 'object' && ('dark' in theme || 'light' in theme)
}

export function resolveShikiOptions(options: ShikiOptions): ResolvedShikiOptions {
  const themes: (IThemeRegistration | Theme)[] = []
  let darkModeThemes: ShikiDarkModeThemes | undefined

  if (!options.theme) {
    themes.push('nord')
  }
  else if (typeof options.theme === 'string') {
    themes.push(options.theme)
  }
  else {
    if (isShikiDarkModeThemes(options.theme)) {
      darkModeThemes = options.theme
      themes.push(options.theme.dark)
      themes.push(options.theme.light)
    }
    else {
      themes.push(options.theme)
    }
  }

  return {
    ...options,
    themes,
    darkModeThemes: darkModeThemes
      ? {
          dark: getThemeName(darkModeThemes.dark),
          light: getThemeName(darkModeThemes.light),
        }
      : undefined,
  }
}

function trimEndNewLine(code: string) {
  return code.replace(/\n$/, '')
}

const MarkdownItShiki: MarkdownIt.PluginWithOptions<ShikiOptions> = (markdownit, options = {}) => {
  const _highlighter: ShikiHighlighter = options!.highlighter!

  const { darkModeThemes } = resolveShikiOptions(options!)

  markdownit.options.highlight = (code, lang) => {
    if (darkModeThemes) {
      const trimmed = trimEndNewLine(code)
      const dark = _highlighter
        .codeToHtml(trimmed, { lang: lang || 'text', theme: darkModeThemes.dark })
        .replace('<pre class="shiki', '<pre class="slidev-code shiki shiki-dark')
      const light = _highlighter
        .codeToHtml(trimmed, { lang: lang || 'text', theme: darkModeThemes.light })
        .replace('<pre class="shiki', '<pre class="slidev-code shiki shiki-light')
      return escapeVueInCode(`<pre class="shiki-container">${dark}${light}</pre>`)
    }
    else {
      return escapeVueInCode(
        _highlighter.codeToHtml(code, { lang: lang || 'text' })
          .replace('<pre class="shiki"', '<pre class="slidev-code shiki"'),
      )
    }
  }
}

export default MarkdownItShiki
