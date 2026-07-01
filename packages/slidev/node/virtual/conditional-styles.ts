import type { TypstCompiler } from '../syntax/typst-math'
import type { VirtualModuleTemplate } from './types'
import { join } from 'node:path'
import { resolveImportUrl } from '../resolver'
import { extractTypstMathCss } from '../syntax/typst-math'

const id = '/@slidev/conditional-styles'

export const templateConditionalStyles: VirtualModuleTemplate = {
  id,
  async getContent({ data, roots, utils }) {
    const imports: string[] = []

    for (const root of roots) {
      const importPath = this.makeAbsoluteImportGlob([
        join(root, 'styles/index.{ts,js,css}'),
        join(root, 'styles.{ts,js,css}'),
        join(root, 'style.{ts,js,css}'),
      ])
      imports.push(`import ${JSON.stringify(importPath)}`)
    }

    if (data.features.typstMath && utils.typstCompiler) {
      // Inject Typst's MathML CSS at runtime via a <style> element so no extra
      // file on disk is needed.
      const css = extractTypstMathCss(utils.typstCompiler as TypstCompiler)
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
