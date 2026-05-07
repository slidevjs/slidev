import type { VirtualModuleTemplate } from './types'
import { join } from 'node:path'
import { makeAbsoluteImportGlob } from '../utils'

const id = `/@slidev/global-layers`

export const templateGlobalLayers: VirtualModuleTemplate = {
  id,
  getContent({ roots, userRoot }) {
    function* getComponent(name: string, names: string[]) {
      yield `const ${name}Components = [\n`
      for (const root of roots) {
        const globs = names.map(name => join(root, `${name}.{ts,js,vue}`))
        yield '  Object.values('
        yield makeAbsoluteImportGlob(id, globs, { import: 'default' }, userRoot)
        yield ')[0],\n'
      }
      yield `].filter(Boolean)\n`
      yield `export const ${name} = { render: () => ${name}Components.map(comp => h(comp)) }\n\n`
    }

    return [
      `import { h } from 'vue'\n\n`,
      ...getComponent('GlobalTop', ['global', 'global-top', 'GlobalTop']),
      ...getComponent('GlobalBottom', ['global-bottom', 'GlobalBottom']),
      ...getComponent('SlideTop', ['slide-top', 'SlideTop']),
      ...getComponent('SlideBottom', ['slide-bottom', 'SlideBottom']),
    ].join('')
  },
}
