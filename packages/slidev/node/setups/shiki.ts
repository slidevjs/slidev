import type { ResolvedSlidevUtils, ShikiSetup } from '@slidev/types'
import fs from 'node:fs/promises'
import { createBundledHighlighter, createSingletonShorthands } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { resolveShikiOptions } from '../../../client/setup/shiki-options'
import { loadSetups } from './load'

let cachedRoots: string[] | undefined
let cachedShiki: Pick<ResolvedSlidevUtils, 'shiki' | 'shikiOptions'> | undefined

export default async function setupShiki(roots: string[]) {
  // Here we use shallow equality because when server is restarted, the roots will be different object.
  if (cachedRoots === roots)
    return cachedShiki!

  const optionsRaw = await loadSetups<ShikiSetup>(
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
  const { options, languageInput, themeInput } = resolveShikiOptions(optionsRaw)

  const createHighlighter = createBundledHighlighter<string, string>({
    engine: createJavaScriptRegexEngine,
    langs: languageInput,
    themes: themeInput,
  })

  cachedRoots = roots
  return cachedShiki = {
    shiki: createSingletonShorthands(createHighlighter),
    shikiOptions: options,
  }
}
