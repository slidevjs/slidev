import type { MarkdownTransformContext } from '@slidev/types'

/**
 * Wrapper KaTex syntax `$$...$$` for highlighting
 */
export function transformKaTexWrapper(ctx: MarkdownTransformContext) {
  // Only apply KaTeX wrapper if formulaRenderer is not set or set to 'katex'
  if (ctx.frontmatter.formulaRenderer && ctx.frontmatter.formulaRenderer !== 'katex')
    return
    
  ctx.s.replace(
    /^\$\$(?:\s*\{([\w*,|-]+)\}\s*?(?:(\{[^}]*\})\s*?)?)?\\n(\S[\s\S]*?)^\$\$/gm,
    (full, rangeStr: string = '', options = '', code: string) => {
      const ranges = !rangeStr.trim() ? [] : rangeStr.trim().split(/\|/g).map(i => i.trim())
      code = code.trimEnd()
      options = options.trim() || '{}'
      return `<KaTexBlockWrapper v-bind="${options}" :ranges='${JSON.stringify(ranges)}'>\\n\\n\$\$\\n${code}\\n\$\$\\n</KaTexBlockWrapper>\\n`
    },
  )
}