import { isTruthy } from '@antfu/utils'
import lz from 'lz-string'
import type { MarkdownTransformContext } from '@slidev/types'

export function transformMonaco(ctx: MarkdownTransformContext, enabled = true) {
  if (!enabled) {
    ctx.s.replace(/{monaco([\w:,-]*)}/g, '')
    return
  }

  // transform monaco
  ctx.s.replace(
    /^```(\w+?)\s*{monaco-diff}\s*?({.*?})?\s*?\n([\s\S]+?)^~~~\s*?\n([\s\S]+?)^```/mg,
    (full, lang = 'ts', options = '{}', code: string, diff: string, index: number) => {
      lang = lang.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      const encodedDiff = lz.compressToBase64(diff)
      ctx.ignores.push([index, index + full.length])
      return `<Monaco code-lz="${encoded}" diff-lz="${encodedDiff}" lang="${lang}" v-bind="${options}" />`
    },
  )
  ctx.s.replace(
    /^```(\w+?)\s*{monaco}\s*?({.*?})?\s*?\n([\s\S]+?)^```/mg,
    (full, lang = 'ts', options = '{}', code: string, index: number) => {
      lang = lang.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      ctx.ignores.push([index, index + full.length])
      return `<Monaco code-lz="${encoded}" lang="${lang}" v-bind="${options}" />`
    },
  )
  ctx.s.replace(
    /^```(\w+?)\s*{monaco-run}\s*?({.*?})?\s*?\n([\s\S]+?)^```/mg,
    (full, lang = 'ts', options = '{}', code: string, index: number) => {
      lang = lang.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      ctx.ignores.push([index, index + full.length])
      return `<Monaco runnable code-lz="${encoded}" lang="${lang}" v-bind="${options}" />`
    },
  )
}

// types auto discovery for TypeScript monaco
export function scanMonacoModules(md: string) {
  const typeModules = new Set<string>()

  md.replace(
    /^```(\w+?)\s*{monaco([\w:,-]*)}[\s\n]*([\s\S]+?)^```/mg,
    (full, lang = 'ts', options: string, code: string) => {
      options = options || ''
      lang = lang.trim()
      if (lang === 'ts' || lang === 'typescript') {
        Array.from(code.matchAll(/\s+from\s+(["'])([\/\w@-]+)\1/g))
          .map(i => i[2])
          .filter(isTruthy)
          .map(i => typeModules.add(i))
      }
      return ''
    },
  )

  return Array.from(typeModules)
}
