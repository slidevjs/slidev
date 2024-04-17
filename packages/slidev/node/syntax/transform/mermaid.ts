import lz from 'lz-string'
import type { MarkdownTransformContext } from '@slidev/types'

/**
 * Transform Mermaid code blocks (render done on client side)
 */
export function transformMermaid(ctx: MarkdownTransformContext) {
  ctx.s.replace(/^```mermaid\s*?({.*?})?\n([\s\S]+?)\n```/mg, (full, options = '', code = '') => {
    code = code.trim()
    options = options.trim() || '{}'
    const encoded = lz.compressToBase64(code)
    return `<Mermaid code-lz="${encoded}" v-bind="${options}" />`
  })
}
