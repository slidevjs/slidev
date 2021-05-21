import { ShikiDarkModeThemes } from 'packages/types'
import { escapeVueInCode } from './markdown'
import type { Highlighter as ShikiHighlighter, IShikiTheme, IThemeRegistration } from 'shiki'
import type MarkdownIt from 'markdown-it'
import type { ShikiOptions } from '@slidev/types'

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

const MarkdownItShiki: MarkdownIt.PluginWithOptions<ShikiOptions> = (markdownit, options = {}) => {
  const _highlighter: ShikiHighlighter = options!.highlighter!

  const { darkModeThemes } = resolveShikiOptions(options!)

  markdownit.options.highlight = (code, lang) => {
    if (darkModeThemes) {
      const dark = _highlighter
        .codeToHtml(code, lang || 'text', darkModeThemes.dark)
        .replace('<pre class="shiki"', '<pre class="slidev-code shiki shiki-dark"')
      const light = _highlighter
        .codeToHtml(code, lang || 'text', darkModeThemes.light)
        .replace('<pre class="shiki"', '<pre class="slidev-code shiki shiki-light"')
      return escapeVueInCode(`<pre class="shiki-container">${dark}${light}</pre>`)
    }
    else {
      return escapeVueInCode(_highlighter.codeToHtml(code, lang || 'text').replace('<pre class="shiki"', '<pre class="slidev-code shiki"'))
    }
  }
}

export default MarkdownItShiki
