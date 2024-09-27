import type { MarkdownTransformContext } from '@slidev/types'
import lz from 'lz-string'

export function transformMonaco(ctx: MarkdownTransformContext) {
  const enabled = (ctx.options.data.config.monaco === true || ctx.options.data.config.monaco === ctx.options.mode)

  if (!enabled) {
    ctx.s.replace(/\{monaco([\w:,-]*)\}/g, '')
    return
  }

  // transform monaco
  ctx.s.replace(
    /^```(\w+) *\{monaco-diff\} *(?:(\{[^\n]*\}) *)?\n([\s\S]+?)^~~~ *\n([\s\S]+?)^```/gm,
    (full, lang = 'ts', options = '{}', code: string, diff: string) => {
      lang = lang.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      const encodedDiff = lz.compressToBase64(diff)
      return `<Monaco code-lz="${encoded}" diff-lz="${encodedDiff}" lang="${lang}" v-bind="${options}" />`
    },
  )
  ctx.s.replace(
    /^```(\w+) *\{monaco\} *(?:(\{[^\n]*\}) *)?\n([\s\S]+?)^```/gm,
    (full, lang = 'ts', options = '{}', code: string) => {
      lang = lang.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      return `<Monaco code-lz="${encoded}" lang="${lang}" v-bind="${options}" />`
    },
  )
  ctx.s.replace(
    /^```(\w+) *\{monaco-run\} *(?:(\{[^\n]*\}) *)?\n([\s\S]+?)^```/gm,
    (full, lang = 'ts', options = '{}', code: string) => {
      lang = lang.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      return `<Monaco runnable code-lz="${encoded}" lang="${lang}" v-bind="${options}" />`
    },
  )
}
