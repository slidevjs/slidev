import type { VirtualModuleTemplate } from './types'
import { resolveSourceFiles, toAtFS } from '../resolver'

function createSetupTemplate(name: string): VirtualModuleTemplate {
  return {
    id: `/@slidev/setups/${name}`,
    getContent({ roots }) {
      const setups = resolveSourceFiles(roots, `setup/${name}`)

      const imports: string[] = []

      setups.forEach((path, idx) => {
        imports.push(`import __n${idx} from '${toAtFS(path)}'`)
      })

      imports.push(`export default [${setups.map((_, idx) => `__n${idx}`).join(',')}]`)

      return imports.join('\n')
    },
  }
}

// setups
const setupModules = ['shiki', 'code-runners', 'monaco', 'mermaid', 'main', 'root', 'routes', 'shortcuts', 'context-menu']

export const templateSetups = setupModules.map(createSetupTemplate)
