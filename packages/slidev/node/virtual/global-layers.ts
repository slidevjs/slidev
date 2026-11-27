import type { VirtualModuleTemplate } from './types'
import { join } from 'pathe'

const id = `/@slidev/global-layers`

export const templateGlobalLayers: VirtualModuleTemplate = {
  id,
  getContent({ roots }) {
    const { makeAbsoluteImportGlob } = this
    const imports = [`import { h } from 'vue'`]
    let importIndex = 0

    function* getComponent(name: string, names: string[]) {
      yield `const ${name}Components = [\n`
      for (const root of roots) {
        const globs = names.map(name => join(root, `${name}.{ts,js,vue}`))
        const importName = `__slidev_global_layer_${importIndex++}`
        imports.push(`import ${importName} from ${JSON.stringify(makeAbsoluteImportGlob(globs, { import: 'default' }))}`)
        yield `  Object.values(${importName})[0],\n`
      }
      yield `].filter(Boolean)\n`
      yield `export const ${name} = { render: () => ${name}Components.map(comp => h(comp)) }\n\n`
    }

    const body = [
      ...getComponent('GlobalTop', ['global', 'global-top', 'GlobalTop']),
      ...getComponent('GlobalBottom', ['global-bottom', 'GlobalBottom']),
      ...getComponent('SlideTop', ['slide-top', 'SlideTop']),
      ...getComponent('SlideBottom', ['slide-bottom', 'SlideBottom']),
    ].join('')

    return `${imports.join('\n')}\n\n${body}`
  },
}
