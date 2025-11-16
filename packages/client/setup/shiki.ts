import setups from '#slidev/setups/shiki'
import { createSingletonPromise } from '@antfu/utils'
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript'
import { createdBundledHighlighter, createSingletonShorthands } from 'shiki/core'
import { resolveShikiOptions, shikiContext } from './shiki-options'

export default createSingletonPromise(async () => {
  const { options, languageNames, languageInput, themeOption, themeNames, themeInput } = resolveShikiOptions(await Promise.all(setups.map(setup => setup(shikiContext))))

  const createHighlighter = createdBundledHighlighter<string, string>({
    engine: createJavaScriptRegexEngine,
    langs: languageInput,
    themes: themeInput,
  })
  const shorthands = createSingletonShorthands(createHighlighter)
  const getEagerHighlighter = createSingletonPromise(() => shorthands.getSingletonHighlighter({
    ...options,
    langs: [...languageNames],
    themes: themeNames,
  }))

  return {
    defaultHighlightOptions: options,
    getEagerHighlighter,
    shorthands,
    languageNames,
    themeNames,
    themeOption,
  }
})
