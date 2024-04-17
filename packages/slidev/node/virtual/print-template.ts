import { toAtFS } from '../resolver'
import type { VirtualModuleTemplate } from './types'

export const templatePrintTemplate: VirtualModuleTemplate = {
  id: '/@slidev/print-template',
  async getContent(_, { printTemplate }) {
    const template = await printTemplate
    return `import PrintTemplate from "${toAtFS(template!)}"\nexport default PrintTemplate`
  },
}
