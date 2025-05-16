import type { MarkdownItShikiOptions } from '@shikijs/markdown-it'
import type { ShikiSetup } from '@slidev/types'
import type { LanguageInput, ShorthandsBundle } from 'shiki/core'
import fs from 'node:fs/promises'
import { red } from 'kolorist'
import { bundledLanguages, bundledThemes } from 'shiki/bundle/full'
import { createdBundledHighlighter, createSingletonShorthands } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { loadSetups } from './load'

let cachedRoots: string[] | undefined
let cachedShiki: {
  shiki: ShorthandsBundle<string, string>
  shikiOptions: MarkdownItShikiOptions
} | undefined

export default async function setupShiki(roots: string[]) {
  // Here we use shallow equality because when server is restarted, the roots will be different object.
  if (cachedRoots === roots)
    return cachedShiki!

  const options = await loadSetups<ShikiSetup>(
    roots,
    'shiki.ts',
    [{
      /** @deprecated */
      async loadTheme(path: string) {
        console.warn('[slidev] `loadTheme` in `setup/shiki.ts` is deprecated. Pass directly the theme name it\'s supported by Shiki. For custom themes, load it manually via `JSON.parse(fs.readFileSync(path, \'utf-8\'))` and pass the raw JSON object instead.')
        return JSON.parse(await fs.readFile(path, 'utf-8'))
      },
    }],
  )

  const browserLanguages: any[] = []
  const nodeLanguages: Record<string, LanguageInput> = bundledLanguages
  for (const option of options) {
    const langs = option?.langs
    if (Array.isArray(langs)) {
      for (const lang of langs.flat()) {
        if (typeof lang === 'function') {
          console.error(red('[slidev] `langs` option in shiki setup cannot be array containing functions. Please use `{ name: loaderFunction }` format instead.'))
        }
        else if (typeof lang === 'string') {
          // Name of a Shiki built-in language
          // In Node environment, they can be loaded on demand without overhead, so all built-in languages are available.
          // Only need to include them explicitly in browser environment.
          browserLanguages.push(lang)
        }
        else if (lang.name) {
          // Custom grammar object
          browserLanguages.push(lang)
          nodeLanguages[lang.name] = lang
          for (const alias of lang.aliases || [])
            nodeLanguages[alias] = lang
        }
      }
    }
    else if (typeof option?.langs === 'object') {
      // Map from name to loader or grammar object
      Object.assign(nodeLanguages, option.langs)
      browserLanguages.push(...Object.values(option.langs).filter(lang => lang?.name))
    }
    else {
      console.error(red('[slidev] Invalid langs option in shiki setup:'), langs)
    }
  }

  const mergedOptions = Object.assign({}, ...options)
  mergedOptions.langs = browserLanguages

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

  const createHighlighter = createdBundledHighlighter<string, string>({
    langs: nodeLanguages,
    themes: bundledThemes,
    engine: createJavaScriptRegexEngine,
  })
  const shiki = createSingletonShorthands<string, string>(createHighlighter)

  cachedRoots = roots
  return cachedShiki = {
    shiki,
    shikiOptions: mergedOptions,
  }
}
