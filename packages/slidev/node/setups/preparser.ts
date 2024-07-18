import { uniq } from '@antfu/utils'
import { injectPreparserExtensionLoader } from '@slidev/parser/fs'
import type { PreparserSetup } from '@slidev/types'
import { resolveAddons } from '../integrations/addons'
import { getRoots } from '../resolver'
import { loadSetups } from './load'

export default async function setupPreparser() {
  const addons = headmatter?.addons as string[] ?? []
  const { userRoot } = await getRoots()
  const roots = uniq([
    ...await resolveAddons(addons),
    userRoot,
  ])
  injectPreparserExtensionLoader(async (headmatter: Record<string, unknown>, filepath: string, mode?: string) => {
    const returns = await loadSetups<PreparserSetup>(roots, 'preparser.ts', [{ filepath, headmatter, mode }])
    return returns.reduce((a, b) => a.concat(b), [])
  })
}
