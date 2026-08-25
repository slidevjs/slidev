import { defineCodeblockTransformer } from '@slidev/types'
import { escapeVueInCode, normalizeRangeStr } from '../utils'
import { parseCodeblockInfo } from './parse'

export default defineCodeblockTransformer(async ({ info, renderHighlighted }) => {
  const { lang, title, rangeStr, options, rest } = parseCodeblockInfo(info)
  const ranges = normalizeRangeStr(rangeStr)
  const optionsProp = options ? `v-bind="${options}"` : ''
  const code = await renderHighlighted({ info: `${lang} ${rest}` })
  return `<CodeBlockWrapper ${optionsProp} title=${JSON.stringify(title)} :ranges='${JSON.stringify(ranges)}'>${escapeVueInCode(code)}</CodeBlockWrapper>`
})
