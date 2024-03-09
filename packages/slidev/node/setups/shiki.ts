import fs from 'node:fs/promises'
import type { MarkdownItShikiOptions } from '@shikijs/markdown-it'
import { loadSetups } from './load'

export async function loadShikiSetups(
  clientRoot: string,
  roots: string[],
) {
  const result: any = await loadSetups(
    clientRoot,
    roots,
    'shiki.ts',
    {
      /** @deprecated */
      async loadTheme(path: string) {
        console.warn('[slidev] `loadTheme` in `setup/shiki.ts` is deprecated. Pass directly the theme name it\'s supported by Shiki. For custom themes, load it manually via `JSON.parse(fs.readFileSync(path, \'utf-8\'))` and pass the raw JSON object instead.')
        return JSON.parse(await fs.readFile(path, 'utf-8'))
      },
    },
    {},
    false,
  )

  if ('theme' in result && 'themes' in result)
    delete result.theme

  // Rename theme to themes when provided in multiple themes format, but exclude when it's a theme object.
  if (result.theme && typeof result.theme !== 'string' && !result.theme.name && !result.theme.tokenColors) {
    result.themes = result.theme
    delete result.theme
  }

  // No theme at all, apply the default
  if (!result.theme && !result.themes) {
    result.themes = {
      dark: 'vitesse-dark',
      light: 'vitesse-light',
    }
  }

  if (result.themes)
    result.defaultColor = false

  return result as MarkdownItShikiOptions
}
