import type { VirtualModuleTemplate } from './types'
import { join } from 'node:path'
import { resolveImportUrl } from '../resolver'
import { makeAbsoluteImportGlob } from '../utils'

const id = '/@slidev/conditional-styles'

export const templateConditionalStyles: VirtualModuleTemplate = {
  id,
  async getContent({ data, roots }) {
    const imports: string[] = []

    for (const root of roots) {
      imports.push(makeAbsoluteImportGlob(id, [
        join(root, 'styles/index.{ts,js,css}'),
        join(root, 'styles.{ts,js,css}'),
        join(root, 'style.{ts,js,css}'),
      ]))
    }

    if (data.features.katex)
      imports.push(`import "${await resolveImportUrl('katex/dist/katex.min.css')}"`)

    return imports.join('\n')
  },
}
