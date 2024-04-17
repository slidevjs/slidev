import { toAtFS } from '../resolver'
import type { VirtualModuleTemplate } from './types'

export const templateSlideLayers: VirtualModuleTemplate = {
  id: '/@slidev/slide-layers',
  async getContent(_, { getLayouts }) {
    const layouts = await getLayouts()
    const top = layouts['slide-top']
    const bottom = layouts['slide-bottom']
    return [
      top ? `import SlideTop from '${toAtFS(top)}'` : `const SlideTop = null`,
      bottom ? `import SlideBottom from '${toAtFS(bottom)}'` : `const SlideBottom = null`,
      'export {',
      '  SlideTop,',
      '  SlideBottom,',
      '}\n',
    ].join('\n')
  },
}
