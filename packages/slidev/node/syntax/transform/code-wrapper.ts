import type { MarkdownTransformContext } from 'packages/types'
import { normalizeRangeStr } from './utils'

export const reCodeBlock = /^```([\w'-]+?)(?:\s*{([\d\w*,\|-]+)}\s*?({.*?})?(.*?))?\n([\s\S]+?)^```$/mg

/**
 * Transform code block with wrapper
 */
export function transformCodeWrapper(ctx: MarkdownTransformContext) {
  ctx.s.replace(
    reCodeBlock,
    (full, lang = '', rangeStr: string = '', options = '', attrs = '', code: string, index: number) => {
      if (ctx.isIgnored(index))
        return full
      const ranges = normalizeRangeStr(rangeStr)
      code = code.trimEnd()
      options = options.trim() || '{}'
      ctx.ignores.push([index, index + full.length])
      return `\n<CodeBlockWrapper v-bind="${options}" :ranges='${JSON.stringify(ranges)}'>\n\n\`\`\`${lang}${attrs}\n${code}\n\`\`\`\n\n</CodeBlockWrapper>`
    },
  )
}
