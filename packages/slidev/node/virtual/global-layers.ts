import type { VirtualModuleTemplate } from './types'
import { join } from 'node:path'
import { makeAbsoluteImportGlob } from '../utils'

export const templateGlobalLayers: VirtualModuleTemplate = {
  id: `/@slidev/global-layers`,
  getContent({ userRoot, roots }) {
    function* getComponent(name: string, names: string[]) {
      yield `const ${name}Components = [\n`
      for (const root of roots) {
        const globs = names.map(name => join(root, `${name}.{ts,js,vue}`))
        yield '  Object.values('
        yield makeAbsoluteImportGlob(userRoot, globs, { import: 'default' })
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
