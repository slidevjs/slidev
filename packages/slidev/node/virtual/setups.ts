import type { VirtualModuleTemplate } from './types'
import { join } from 'pathe'

function createSetupTemplate(name: string): VirtualModuleTemplate {
  const id = `/@slidev/setups/${name}`
  return {
    id,
    getContent({ roots }) {
      const imports: string[] = []
      const globs = roots.map((root) => {
        const glob = join(root, `setup/${name}.{ts,js,mts,mjs}`)
        const importName = `__slidev_setup_${imports.length}`
        imports.push(`import ${importName} from ${JSON.stringify(this.makeAbsoluteImportGlob([glob], { import: 'default' }))}`)
        return `Object.values(${importName})[0]`
      })
      return `${imports.join('\n')}\n\nexport default [${globs.join(', ')}].filter(Boolean)`
    },
  }
}

// setups
const setupModules = ['shiki', 'code-runners', 'monaco', 'mermaid', 'mermaid-renderer', 'main', 'root', 'routes', 'shortcuts', 'context-menu']

export const templateSetups = setupModules.map(createSetupTemplate)
