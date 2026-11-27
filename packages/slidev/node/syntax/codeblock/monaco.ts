import { defineCodeblockTransformer } from '@slidev/types'
import lz from 'lz-string'

const RE_MONACO = /^([\w'-]+)?\s*\{(monaco[\w-]*)\}/
const RE_DIFF_SEPARATOR = /^\s*~~~\s*\n/m

function extractBracedExpression(input: string): string | undefined {
  const start = input.indexOf('{')
  if (start === -1)
    return

  let depth = 0
  let quote: string | undefined
  let escaped = false

  for (let i = start; i < input.length; i++) {
    const char = input[i]

    if (quote) {
      if (escaped)
        escaped = false
      else if (char === '\\')
        escaped = true
      else if (char === quote)
        quote = undefined
      continue
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char
    }
    else if (char === '{') {
      depth++
    }
    else if (char === '}') {
      depth--
      if (depth === 0)
        return input.slice(start, i + 1)
    }
  }
}

export default defineCodeblockTransformer(async ({ info, code, options: { data: { config }, mode } }) => {
  const match = info.match(RE_MONACO)
  if (!match)
    return
  const [, lang = '', monaco] = match

  const rest = info.slice(match[0].length)
  const options = rest.trimStart().startsWith('{')
    ? extractBracedExpression(rest)
    : undefined

  const monacoEnabled = config.monaco === true || config.monaco === mode
  if (!monacoEnabled) {
    return
  }

  let encoded
  let diff = ''
  if (monaco === 'monaco-diff') {
    const [original, modified] = code.split(RE_DIFF_SEPARATOR, 2)
    encoded = lz.compressToBase64(original)
    diff = modified === undefined
      ? ''
      : `diff-lz="${lz.compressToBase64(modified)}"`
  }
  else {
    encoded = lz.compressToBase64(code)
  }

  const optionsProp = options
    ? `v-bind="${options}"`
    : ''
  const runnable = monaco === 'monaco-run'
    ? 'runnable'
    : ''
  return `<Monaco ${optionsProp} ${runnable} lang="${lang}" code-lz="${encoded}" ${diff} />`
})
