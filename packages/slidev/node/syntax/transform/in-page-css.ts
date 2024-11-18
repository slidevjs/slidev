import type { MarkdownTransformContext } from '@slidev/types'
import { getCodeBlocks } from './utils'

/**
 * Transform <style> in markdown to scoped style with page selector
 */
export function transformPageCSS(ctx: MarkdownTransformContext) {
  const codeBlocks = getCodeBlocks(ctx.s.original)

  ctx.s.replace(
    /(\n<style[^>]*>)([\s\S]+?)(<\/style>)/g,
    (full, start, css, end, index) => {
      if (codeBlocks.isInsideCodeblocks(index))
        return full
      if (!start.includes('scoped'))
        start = start.replace('<style', '<style scoped')
      return `${start}\n${css}${end}`
    },
  )
}
