import type { PreparserSetup } from '@slidev/types'
import { uniq } from '@antfu/utils'
import { injectPreparserExtensionLoader } from '@slidev/parser/fs'
import { resolveAddons } from '../integrations/addons'
import { getRoots } from '../resolver'
import { loadSetups } from './load'

export default function setupPreparser() {
  injectPreparserExtensionLoader(async (headmatter: Record<string, unknown>, filepath: string, mode?: string) => {
    const addons = headmatter?.addons as string[]
    // if (!addons?.length)
    //   return []
    const { userRoot } = await getRoots()
    const roots = uniq([
      ...await resolveAddons(addons),
      userRoot,
    ])
    const returns = await loadSetups<PreparserSetup>(roots, 'preparser.ts', [{ filepath, headmatter, mode }])
    return returns.flat()
  })
}
