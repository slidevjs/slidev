import type { MarkdownTransformContext } from '@slidev/types'

/**
 * Wrapper KaTex syntax `$$...$$` for highlighting
 */
export function transformKaTexWrapper(ctx: MarkdownTransformContext) {
  ctx.s.replace(
    /^\$\$(?:\s*{([\d\w*,\|-]+)}\s*?({.*?})?\s*?)?\n([\s\S]+?)^\$\$/mg,
    (full, rangeStr: string = '', options = '', code: string) => {
      const ranges = !rangeStr.trim() ? [] : rangeStr.trim().split(/\|/g).map(i => i.trim())
      code = code.trimEnd()
      options = options.trim() || '{}'
      return `<KaTexBlockWrapper v-bind="${options}" :ranges='${JSON.stringify(ranges)}'>\n\n\$\$\n${code}\n\$\$\n</KaTexBlockWrapper>\n`
    },
  )
}
