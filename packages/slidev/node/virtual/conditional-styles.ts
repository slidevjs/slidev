import type { VirtualModuleTemplate } from './types'
import { join } from 'node:path'
import { resolveImportUrl } from '../resolver'
import { getTypstMathCss } from '../syntax/typst-math'

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

    if (data.features.typstMath) {
      // Inject Typst's MathML CSS as an inline virtual CSS module. We embed it
      // as a data URI so no extra file on disk is needed.
      const css = getTypstMathCss()
      const escaped = css.replace(/\\/g, '\\\\').replace(/`/g, '\\`')
      imports.push(`
const __typstMathStyle = document.createElement('style')
__typstMathStyle.textContent = \`${escaped}\`
document.head.appendChild(__typstMathStyle)
`)
    }
    else if (data.features.katex) {
      imports.push(`import "${await resolveImportUrl('katex/dist/katex.min.css')}"`)
    }

    return imports.join('\n')
  },
}
