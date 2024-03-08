import { isTruthy } from '@antfu/utils'
import lz from 'lz-string'

export function transformMonaco(md: string, enabled = true) {
  if (!enabled)
    return truncateMancoMark(md)

  // transform monaco
  md = md.replace(
    /^```(\w+?)\s*{monaco-diff}\s*?({.*?})?\s*?\n([\s\S]+?)^~~~\s*?\n([\s\S]+?)^```/mg,
    (full, lang = 'ts', options = '{}', code: string, diff: string) => {
      lang = lang.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      const encodedDiff = lz.compressToBase64(diff)
      return `<Monaco code-lz="${encoded}" diff-lz="${encodedDiff}" lang="${lang}" v-bind="${options}" />`
    },
  )
  md = md.replace(
    /^```(\w+?)\s*{monaco}\s*?({.*?})?\s*?\n([\s\S]+?)^```/mg,
    (full, lang = 'ts', options = '{}', code: string) => {
      lang = lang.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      return `<Monaco code-lz="${encoded}" lang="${lang}" v-bind="${options}" />`
    },
  )
  md = md.replace(
    /^```(\w+?)\s*{monaco-run}\s*?({.*?})?\s*?\n([\s\S]+?)^```/mg,
    (full, lang = 'ts', options = '{}', code: string) => {
      lang = lang.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      return `<Monaco runnable code-lz="${encoded}" lang="${lang}" v-bind="${options}" />`
    },
  )
  return md
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

export function truncateMancoMark(md: string) {
  return md.replace(/{monaco([\w:,-]*)}/g, '')
}
