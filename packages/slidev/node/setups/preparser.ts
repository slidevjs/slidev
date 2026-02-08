import type { PreparserSetup } from '@slidev/types'
import { uniq } from '@antfu/utils'
import { injectPreparserExtensionLoader } from '@slidev/parser/fs'
import { resolveAddons } from '../integrations/addons'
import { resolveTheme } from '../integrations/themes'
import { getRoots } from '../resolver'
import { loadSetups } from './load'

export default function setupPreparser() {
  injectPreparserExtensionLoader(async (headmatter: Record<string, unknown>, filepath: string, mode?: string) => {
    // Ensure addons is an array or an empty array if undefined
    const addons = Array.isArray(headmatter?.addons) ? headmatter.addons as string[] : []

    // Resolve theme from headmatter (matching logic from options.ts)
    let themeRaw = headmatter?.theme as string | null | undefined
    themeRaw = themeRaw === null ? 'none' : (themeRaw || 'default')

    const { userRoot } = await getRoots()
    const [, themeRoot] = await resolveTheme(themeRaw, filepath)
    const themeRoots = themeRoot ? [themeRoot] : []

    const roots = uniq([
      ...themeRoots,
      ...await resolveAddons(addons),
      userRoot,
    ])

    const returns = await loadSetups<PreparserSetup>(roots, 'preparser.ts', [{ filepath, headmatter, mode }])
    return returns.flat()
  })
}
