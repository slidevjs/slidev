import type { LanguageInput, LanguageRegistration, MaybeGetter, SpecialLanguage, ThemeInput, ThemeRegistration } from 'shiki'
import { uniq } from '@antfu/utils'
import { resolveImportUrl } from '../resolver'
import type { VirtualModuleTemplate } from './types'

export const templateShiki: VirtualModuleTemplate = {
  id: '/@slidev/shiki',
  getContent: async ({ utils }) => {
    const options = utils.shikiOptions
    const langs = await resolveLangs(options.langs || ['markdown', 'vue', 'javascript', 'typescript', 'html', 'css'])
    const resolvedThemeOptions = 'themes' in options
      ? {
          themes: Object.fromEntries(await Promise.all(Object.entries(options.themes)
            .map(async ([name, value]) => [name, await resolveTheme(value!)]),
          )) as Record<string, ThemeRegistration | string>,
        }
      : {
          theme: await resolveTheme(options.theme || 'vitesse-dark'),
        }

    const themes = resolvedThemeOptions.themes
      ? Object.values(resolvedThemeOptions.themes)
      : [resolvedThemeOptions.theme!]

    const themeOptionsNames = resolvedThemeOptions.themes
      ? { themes: Object.fromEntries(Object.entries(resolvedThemeOptions.themes).map(([name, value]) => [name, typeof value === 'string' ? value : value.name])) }
      : { theme: typeof resolvedThemeOptions.theme === 'string' ? resolvedThemeOptions.theme : resolvedThemeOptions.theme.name }

    async function normalizeGetter<T>(p: MaybeGetter<T>): Promise<T> {
      const r = typeof p === 'function' ? (p as any)() : p
      return r.default || r
    }

    async function resolveLangs(langs: (LanguageInput | SpecialLanguage | string)[]): Promise<(LanguageRegistration | string)[]> {
      const awaited = await Promise.all(langs.map(lang => normalizeGetter(lang)))
      return uniq(awaited.flat())
    }

    async function resolveTheme(theme: string | ThemeInput): Promise<ThemeRegistration | string> {
      return typeof theme === 'string' ? theme : await normalizeGetter(theme)
    }

    const langsInit = await Promise.all(langs
      .map(async lang =>
        typeof lang === 'string'
          ? `import('${await resolveImportUrl(`shiki/langs/${lang}.mjs`)}')`
          : JSON.stringify(lang)),
    )

    const themesInit = await Promise.all(themes
      .map(async theme =>
        typeof theme === 'string'
          ? `import('${await resolveImportUrl(`shiki/themes/${theme}.mjs`)}')`
          : JSON.stringify(theme)))

    const langNames = langs
      .flatMap(lang => typeof lang === 'string' ? lang : lang.name)

    const lines: string[] = []
    lines.push(
      `import { createHighlighterCore } from "${await resolveImportUrl('shiki/core')}"`,
      `export { shikiToMonaco } from "${await resolveImportUrl('@shikijs/monaco')}"`,

      `export const languages = ${JSON.stringify(langNames)}`,
      `export const themes = ${JSON.stringify(themeOptionsNames.themes || themeOptionsNames.theme)}`,

      'export const shiki = createHighlighterCore({',
      `  themes: [${themesInit.join(',')}],`,
      `  langs: [${langsInit.join(',')}],`,
      `  loadWasm: import('${await resolveImportUrl('shiki/wasm')}'),`,
      '})',

      'let highlight',
      'export async function getHighlighter() {',
      '  if (highlight) return highlight',
      '  const highlighter = await shiki',
      '  highlight = (code, lang, options) => highlighter.codeToHtml(code, {',
      '    lang,',
      `    theme: ${JSON.stringify(themeOptionsNames.theme)},`,
      `    themes: ${JSON.stringify(themeOptionsNames.themes)},`,
      '    defaultColor: false,',
      '    ...options,',
      '  })',
      '  return highlight',
      '}',
    )

    return lines.join('\n')
  },
}
