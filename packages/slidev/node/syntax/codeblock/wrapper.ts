import { defineCodeblockTransformer } from '@slidev/types'
import { escapeVueInCode, normalizeRangeStr } from '../utils'

const RE_BLOCK_INFO = /^([\w'-]+)?(?:[ \t]*|[ \t][ \w\t'-]*)(?:\[([^\]]*)\])?[ \t]*(?:\{([\w*,|-]+)\}[ \t]*(\{[^}]*\})?([^\r\n]*))?/

export default defineCodeblockTransformer(async ({ info, renderHighlighted }) => {
  const [, lang = '', title = '', rangeStr = '', options, rest = ''] = info.match(RE_BLOCK_INFO) ?? []
  const ranges = normalizeRangeStr(rangeStr)
  const optionsProp = options ? `v-bind="${options}"` : ''
  const code = await renderHighlighted({ info: `${lang} ${rest}` })
  return `<CodeBlockWrapper ${optionsProp} title=${JSON.stringify(title)} :ranges='${JSON.stringify(ranges)}'>${escapeVueInCode(code)}</CodeBlockWrapper>`
})
