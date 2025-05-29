import type { MarkdownTransformContext } from '@slidev/types'

/**
 * Wrapper Typst syntax `$$...$$` for highlighting
 */
export function transformTypstWrapper(ctx: MarkdownTransformContext) {
  ctx.s.replace(
    /^\\$\\$(?:\\s*\\{([\\w*,|-]+)\\}\\s*?(?:(\\{[^}]*\\})\\s*?)?)?\\n(\\S[\\s\\S]*?)^\\$\\$/gm,
    (full, rangeStr: string = '', options = '', code: string) => {
      const ranges = !rangeStr.trim() ? [] : rangeStr.trim().split(/\\|/g).map(i => i.trim())
      code = code.trimEnd()
      options = options.trim() || '{}'
      return `<TypstBlockWrapper v-bind="${options}" :ranges='${JSON.stringify(ranges)}'>\\n\\n\\$\\$\\n${code}\\n\\$\\$\\n</TypstBlockWrapper>\\n`
    },
  )
}