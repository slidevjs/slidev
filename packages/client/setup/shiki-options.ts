// This module also runs in the Node.js environment

import type { ResolvedSlidevUtils, ShikiContext, ShikiSetupReturn } from '@slidev/types'
import type { LanguageInput, ThemeInput, ThemeRegistrationAny } from 'shiki'
import { objectMap } from '@antfu/utils'
import { red, yellow } from 'ansis'
import { bundledLanguages, bundledThemes } from 'shiki'

export const shikiContext: ShikiContext = {
  /** @deprecated */
  loadTheme() {
    throw new Error('`loadTheme` is no longer supported.')
  },
}

export function resolveShikiOptions(options: (ShikiSetupReturn | void)[]) {
  const mergedOptions: Record<string, any> = Object.assign({}, ...options)

  if ('theme' in mergedOptions && 'themes' in mergedOptions)
    delete mergedOptions.theme

  // Rename theme to themes when provided in multiple themes format, but exclude when it's a theme object.
  if (mergedOptions.theme && typeof mergedOptions.theme !== 'string' && !mergedOptions.theme.name && !mergedOptions.theme.tokenColors) {
    mergedOptions.themes = mergedOptions.theme
    delete mergedOptions.theme
  }

  // No theme at all, apply the default
  if (!mergedOptions.theme && !mergedOptions.themes) {
    mergedOptions.themes = {
      dark: 'vitesse-dark',
      light: 'vitesse-light',
    }
  }

  if (mergedOptions.themes)
    mergedOptions.defaultColor = false

  const themeOption = extractThemeName(mergedOptions.theme) || extractThemeNames(mergedOptions.themes || {})
  const themeNames = typeof themeOption === 'string' ? [themeOption] : Object.values(themeOption)

  const themeInput: Record<string, ThemeInput> = Object.assign({}, bundledThemes)
  if (typeof mergedOptions.theme === 'object' && mergedOptions.theme?.name) {
    themeInput[mergedOptions.theme.name] = mergedOptions.theme
  }
  if (mergedOptions.themes) {
    for (const theme of Object.values<ThemeRegistrationAny | string>(mergedOptions.themes)) {
      if (typeof theme === 'object' && theme?.name) {
        themeInput[theme.name] = theme
      }
    }
  }

  const languageNames = new Set<string>(['markdown', 'vue', 'javascript', 'typescript', 'html', 'css'])
  const languageInput: Record<string, LanguageInput> = Object.assign({}, bundledLanguages)
  for (const option of options) {
    const langs = option?.langs
    if (langs == null)
      continue
    if (Array.isArray(langs)) {
      for (const lang of langs.flat()) {
        if (typeof lang === 'function') {
          console.error(red('[slidev] `langs` option returned by setup/shiki.ts cannot be an array containing functions. Please use the record format (`{ [name]: () => {...} }`) instead.'))
        }
        else if (typeof lang === 'string') {
          // a name of a Shiki built-in language
          // which can be loaded on demand without overhead, so all built-in languages are available.
          // Only need to include them explicitly in browser environment.
          languageNames.add(lang)
        }
        else if (lang.name) {
          // a custom grammar object
          languageNames.add(lang.name)
          languageInput[lang.name] = lang
          for (const alias of lang.aliases || []) {
            languageNames.add(alias)
            languageInput[alias] = lang
          }
        }
        else {
          console.error(red('[slidev] Invalid lang option in shiki setup:'), lang)
        }
      }
    }
    else if (typeof langs === 'object') {
      // a map from name to loader or grammar object
      for (const name of Object.keys(langs))
        languageNames.add(name)
      Object.assign(languageInput, langs)
    }
    else {
      console.error(red('[slidev] Invalid langs option in shiki setup:'), langs)
    }
  }

  return {
    options: mergedOptions as ResolvedSlidevUtils['shikiOptions'],
    themeOption,
    themeNames,
    themeInput,
    languageNames,
    languageInput,
  }
}

function extractThemeName(theme?: ThemeRegistrationAny | string): string | undefined {
  if (!theme)
    return undefined
  if (typeof theme === 'string')
    return theme
  if (!theme.name)
    console.warn(yellow('[slidev] Theme'), theme, yellow('does not have a name, which may cause issues.'))
  return theme.name
}

function extractThemeNames(themes?: Record<string, ThemeRegistrationAny | string>): Record<string, string> {
  if (!themes)
    return {}
  return objectMap(themes, (key, theme) => {
    const name = extractThemeName(theme)
    if (!name)
      return undefined
    return [key, name]
  })
}
