import type { ShikiDarkModeThemes } from 'packages/types'
import type { IShikiTheme, IThemeRegistration, Highlighter as ShikiHighlighter } from 'shiki'
import type MarkdownIt from 'markdown-it'
import type { ShikiOptions } from '@slidev/types'
import { escapeVueInCode } from './markdown'

function getThemeName(theme: IThemeRegistration) {
  if (typeof theme === 'string')
    return theme
  return (theme as IShikiTheme).name
}

export function resolveShikiOptions(options: ShikiOptions) {
  const themes: IThemeRegistration[] = []
  let darkModeThemes: ShikiDarkModeThemes | undefined

  if (!options.theme) {
    themes.push('nord')
  }
  else if (typeof options.theme === 'string') {
    themes.push(options.theme)
  }
  else {
    if ('dark' in options.theme || 'light' in options.theme) {
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
        .replace('<pre class="shiki"', '<pre class="slidev-code shiki shiki-dark"')
      const light = _highlighter
        .codeToHtml(trimmed, { lang: lang || 'text', theme: darkModeThemes.light })
        .replace('<pre class="shiki"', '<pre class="slidev-code shiki shiki-light"')
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
