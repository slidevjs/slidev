import type { VirtualModuleTemplate } from './types'
import { join } from 'pathe'
import { resolveImportUrl } from '../resolver'

const id = '/@slidev/conditional-styles'

export const templateConditionalStyles: VirtualModuleTemplate = {
  id,
  async getContent({ data, roots }) {
    const imports: string[] = []

    for (const root of roots) {
      const importPath = this.makeAbsoluteImportGlob([
        join(root, 'styles/index.{ts,js,css}'),
        join(root, 'styles.{ts,js,css}'),
        join(root, 'style.{ts,js,css}'),
      ])
      imports.push(`import ${JSON.stringify(importPath)}`)
    }

    if (data.features.katex)
      imports.push(`import "${await resolveImportUrl('katex/dist/katex.min.css')}"`)

    return imports.join('\n')
  },
}
