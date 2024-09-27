import type { VirtualModuleTemplate } from './types'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { toAtFS } from '../resolver'

export const templateGlobalLayers: VirtualModuleTemplate = {
  id: `/@slidev/global-layers`,
  getContent({ roots }) {
    const imports: string[] = []

    let n = 0
    function getComponent(names: string[]) {
      const components = roots
        .flatMap(root => names.map(name => join(root, name)))
        .filter(i => existsSync(i))

      imports.push(components.map((path, i) => `import __n${n}_${i} from '${toAtFS(path)}'`).join('\n'))
      const render = components.map((_, i) => `h(__n${n}_${i})`).join(',')

      n++

      return `{ render: () => [${render}] }`
    }

    const globalTop = getComponent(['global.vue', 'global-top.vue', 'GlobalTop.vue'])
    const globalBottom = getComponent(['global-bottom.vue', 'GlobalBottom.vue'])
    const slideTop = getComponent(['slide-top.vue', 'SlideTop.vue'])
    const slideBottom = getComponent(['slide-bottom.vue', 'SlideBottom.vue'])

    return [
      imports.join('\n'),
      `import { h } from 'vue'`,
      `export const GlobalTop = ${globalTop}`,
      `export const GlobalBottom = ${globalBottom}`,
      `export const SlideTop = ${slideTop}`,
      `export const SlideBottom = ${slideBottom}`,
    ].join('\n')
  },
}
