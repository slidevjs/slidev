import { defineCodeblockTransformer } from '@slidev/types'
import lz from 'lz-string'
import { extractBalancedBlock } from './parse'

const RE_MONACO = /^([\w'#+-]+)?\s*\{(monaco[\w-]*)\}/
const RE_DIFF_SEPARATOR = /^\s*~~~\s*\n/m

export default defineCodeblockTransformer(async ({ info, code, options: { data: { config }, mode } }) => {
  const match = info.match(RE_MONACO)
  if (!match)
    return
  const [, lang = '', monaco] = match
  const remainder = info.slice(match[0].length)
  const options = extractBalancedBlock(remainder)?.body

  const monacoEnabled = config.monaco === true || config.monaco === mode
  if (!monacoEnabled) {
    return
  }

  let encoded
  let diff = ''
  if (monaco === 'monaco-diff') {
    const [original, modified] = code.split(RE_DIFF_SEPARATOR, 2)
    encoded = lz.compressToBase64(original)
    diff = modified === undefined ? '' : `diff-lz="${lz.compressToBase64(modified)}"`
  }
  else {
    encoded = lz.compressToBase64(code)
  }

  const optionsProp = options ? `v-bind="${options}"` : ''
  const runnable = monaco === 'monaco-run' ? 'runnable' : ''
  return `<Monaco ${optionsProp} ${runnable} lang="${lang}" code-lz="${encoded}" ${diff} />`
})
