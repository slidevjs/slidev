import type { PreparserSetup } from '@slidev/types'
import { injectPreparserExtensionLoader } from '@slidev/parser/fs'
import { loadSetups } from './load'

export default function setupPreparser() {
  injectPreparserExtensionLoader(async (roots: string[], headmatter: Record<string, unknown>, filepath: string, mode?: string) => {
    const returns = await loadSetups<PreparserSetup>(roots, 'preparser.ts', [{ filepath, headmatter, mode }])
    return returns.flat()
  })
}
