import type { MarkdownTransformContext } from '@slidev/types'
import { normalizeRangeStr } from './utils'

export const reCodeBlock = /^```([\w'-]+?)(?:\s*{([\d\w*,\|-]+)}\s*?({.*?})?(.*?))?\r?\n([\s\S]+?)^```$/mg

/**
 * Transform code block with wrapper
 */
export function transformCodeWrapper(ctx: MarkdownTransformContext) {
  ctx.s.replace(
    reCodeBlock,
    (full, lang = '', rangeStr: string = '', options = '', attrs = '', code: string) => {
      const ranges = normalizeRangeStr(rangeStr)
      code = code.trimEnd()
      options = options.trim() || '{}'
      return `\n<CodeBlockWrapper v-bind="${options}" :ranges='${JSON.stringify(ranges)}'>\n\n\`\`\`${lang}${attrs}\n${code}\n\`\`\`\n\n</CodeBlockWrapper>`
    },
  )
}
