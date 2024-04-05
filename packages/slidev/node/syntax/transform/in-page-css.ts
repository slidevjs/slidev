import type { MarkdownTransformContext } from '@slidev/types'

/**
 * Transform <style> in markdown to scoped style with page selector
 */
export function transformPageCSS(ctx: MarkdownTransformContext, id: string) {
  const page = id.match(/(\d+)\.md$/)?.[1]
  if (!page)
    return

  ctx.s.replace(
    /(\n<style[^>]*?>)([\s\S]+?)(<\/style>)/g,
    (full, start, css, end, index) => {
      // don't replace `<style>` inside code blocks, #101
      if (ctx.isIgnored(index))
        return full
      if (!start.includes('scoped'))
        start = start.replace('<style', '<style scoped')
      return `${start}\n${css}${end}`
    },
  )
}
