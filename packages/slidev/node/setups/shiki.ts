import type { MarkdownItShikiOptions } from '@shikijs/markdown-it'
import type { ShikiSetup } from '@slidev/types'
import type { Highlighter } from 'shiki'
import fs from 'node:fs/promises'
import { bundledLanguages, createHighlighter } from 'shiki'
import { loadSetups } from './load'

let cachedRoots: string[] | undefined
let cachedShiki: {
  shiki: Highlighter
  shikiOptions: MarkdownItShikiOptions
} | undefined

export default async function setupShiki(roots: string[]) {
  // Here we use shallow equality because when server is restarted, the roots will be different object.
  if (cachedRoots === roots)
    return cachedShiki!
  cachedShiki?.shiki.dispose()

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
  const mergedOptions = Object.assign({}, ...options)

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

  const shiki = await createHighlighter({
    ...mergedOptions,
    langs: mergedOptions.langs ?? Object.keys(bundledLanguages),
    themes: 'themes' in mergedOptions ? Object.values(mergedOptions.themes) : [mergedOptions.theme],
  })

  cachedRoots = roots
  return cachedShiki = {
    shiki,
    shikiOptions: mergedOptions,
  }
}
