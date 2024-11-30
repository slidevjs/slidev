import type { MarkdownTransformContext } from '@slidev/types'
import lz from 'lz-string'

/**
 * Transform Mermaid code blocks (render done on client side)
 */
export function transformMermaid(ctx: MarkdownTransformContext) {
  ctx.s.replace(
    /^```mermaid *(\{[^\n]*\})?\n([\s\S]+?)\n```/gm,
    (full, options = '', code = '') => {
      code = code.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      return `<Mermaid code-lz="${encoded}" v-bind="${options}" />`
    },
  )
}
