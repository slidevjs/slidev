import type { VirtualModuleTemplate } from './types'
import { join } from 'node:path'
import { makeAbsoluteImportGlob } from '../utils'

function createSetupTemplate(name: string): VirtualModuleTemplate {
  return {
    id: `/@slidev/setups/${name}`,
    getContent({ mode, userRoot, roots }) {
      const globs = roots.map((root) => {
        const glob = join(root, `setup/${name}.{ts,js,mts,mjs}`)
        return `Object.values(${makeAbsoluteImportGlob(mode, userRoot, [glob], { import: 'default' })})[0]`
      })
      return `export default [${globs.join(', ')}].filter(Boolean)`
    },
  }
}

// setups
const setupModules = ['shiki', 'code-runners', 'monaco', 'mermaid', 'mermaid-renderer', 'main', 'root', 'routes', 'shortcuts', 'context-menu']

export const templateSetups = setupModules.map(createSetupTemplate)
