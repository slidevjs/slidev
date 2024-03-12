import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { toAtFS } from '../resolver'
import type { VirtualModuleTemplate } from './types'

function createGlobalComponentTemplate(layer: 'top' | 'bottom' | 'handout-bottom' | 'handout-cover'): VirtualModuleTemplate {
  return {
    id: `/@slidev/global-components/${layer}`,
    getContent({ roots }) {
      const components = roots
        .flatMap((root) => {
          if (layer === 'top') {
            return [
              join(root, 'global.vue'),
              join(root, 'global-top.vue'),
              join(root, 'GlobalTop.vue'),
            ]
          }
          else if (layer === 'handout-bottom') {
            return [
              join(root, 'handout-bottom.vue'),
              join(root, 'HandoutBottom.vue'),
            ]
          }
          else if (layer === 'handout-cover') {
            return [
              join(root, 'handout-cover.vue'),
              join(root, 'HandoutCover.vue'),
            ]
          }
          else {
            return [
              join(root, 'global-bottom.vue'),
              join(root, 'GlobalBottom.vue'),
            ]
          }
        })
        .filter(i => existsSync(i))

      const imports = components.map((i, idx) => `import __n${idx} from '${toAtFS(i)}'`).join('\n')
      const render = components.map((i, idx) => `h(__n${idx})`).join(',')

      return `
${imports}
import { h } from 'vue'
export default {
render() {
  return [${render}]
}
}
`
    },
  }
}

export const templateNavControls: VirtualModuleTemplate = {
  id: '/@slidev/custom-nav-controls',
  getContent({ roots }) {
    const components = roots
      .flatMap((root) => {
        return [
          join(root, 'custom-nav-controls.vue'),
          join(root, 'CustomNavControls.vue'),
        ]
      })
      .filter(i => existsSync(i))

    const imports = components.map((i, idx) => `import __n${idx} from '${toAtFS(i)}'`).join('\n')
    const render = components.map((i, idx) => `h(__n${idx})`).join(',')

    return `
${imports}
import { h } from 'vue'
export default {
render() {
  return [${render}]
}
}
`
  },
}

export const templateGlobalTop = createGlobalComponentTemplate('top')
export const templateGlobalBottom = createGlobalComponentTemplate('bottom')
export const templateGlobalHandoutBottom = createGlobalComponentTemplate('handout-bottom')
export const templateGlobalHandoutCover = createGlobalComponentTemplate('handout-cover')
