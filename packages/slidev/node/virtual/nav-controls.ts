import type { VirtualModuleTemplate } from './types'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { toAtFS } from '../resolver'

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

    return `${imports}
import { h } from 'vue'
export default {
  render: () => [${render}],
}`
  },
}
