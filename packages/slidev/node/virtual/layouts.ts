import { toAtFS } from '../resolver'
import type { VirtualModuleTemplate } from './types'

export const templateLayouts: VirtualModuleTemplate = {
  id: '/@slidev/layouts',
  async getContent(_, { getLayouts }) {
    const layouts = await getLayouts()
    return [
      ...Object.values(layouts).map((path, idx) => `import _${idx} from "${toAtFS(path)}"`),
      'export default {',
      ...Object.keys(layouts).map((name, idx) => `"${name}": _${idx},`),
      '}\n',
    ].join('\n')
  },
}
