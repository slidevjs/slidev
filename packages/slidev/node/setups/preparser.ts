import type { PreparserSetup } from '@slidev/types'
import { uniq } from '@antfu/utils'
import { injectPreparserExtensionLoader } from '@slidev/parser/fs'
import { resolveAddons } from '../integrations/addons'
import { getRoots } from '../resolver'
import { loadSetups } from './load'

export default function setupPreparser() {
  injectPreparserExtensionLoader(async (headmatter: Record<string, unknown>, filepath: string, mode?: string) => {
    // Ensure addons is an array or an empty array if undefined
    const addons = Array.isArray(headmatter?.addons) ? headmatter.addons as string[] : []

    const { userRoot } = await getRoots()
    const roots = uniq([
      ...await resolveAddons(addons),
      userRoot,
    ])

    const returns = await loadSetups<PreparserSetup>(roots, 'preparser.ts', [{ filepath, headmatter, mode }])
    return returns.flat()
  })
}
