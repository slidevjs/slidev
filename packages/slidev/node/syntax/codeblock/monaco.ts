import { defineCodeblockTransformer } from '@slidev/types'
import lz from 'lz-string'

// eslint-disable-next-line regexp/no-super-linear-backtracking
const RE_MONACO = /^([\w'-]+)?\s*\{(monaco[\w-]*)\}\s*(\{[^}]*\})?(.*)$/

export default defineCodeblockTransformer(async ({ info, code, renderHighlighted, options: { data: { config }, mode } }) => {
  const match = info.match(RE_MONACO)
  if (!match)
    return
  const [, lang = '', monaco, options, rest = ''] = match

  const monacoEnabled = config.monaco === true || config.monaco === mode
  if (!monacoEnabled) {
    return renderHighlighted({ info: `${lang} ${rest}` })
  }

  let encoded, diff
  if (monaco === 'monaco-diff') {
    const [original, modified] = code.split(/^\s*~~~\s*\n/m, 2)
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
