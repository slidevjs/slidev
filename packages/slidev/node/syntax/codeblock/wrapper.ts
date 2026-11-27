import { defineCodeblockTransformer } from '@slidev/types'
import { escapeVueInCode, extractBracedExpression, normalizeRangeStr } from '../utils'

const RE_BLOCK_INFO = /^([\w'#+-]+)?([ \w\t'-]*)(?:\[([^\]]*)\])?[ \t]*(?:\{([\w,|\-*]+)\})?[ \t]*/

export default defineCodeblockTransformer(async ({ info, renderHighlighted }) => {
  const match = info.match(RE_BLOCK_INFO)!
  const [, lang = '', meta = '', title = '', rangeStr = ''] = match
  let rest = info.slice(match[0].length)
  const options = rest.startsWith('{')
    ? extractBracedExpression(rest)
    : undefined
  if (options)
    rest = rest.slice(options.length)
  const ranges = normalizeRangeStr(rangeStr)
  const optionsProp = options
    ? `v-bind="${options}"`
    : ''
  const code = await renderHighlighted({ info: `${lang} ${meta}${rest}` })
  return `<CodeBlockWrapper ${optionsProp} title=${JSON.stringify(title)} :ranges='${JSON.stringify(ranges)}'>${escapeVueInCode(code)}</CodeBlockWrapper>`
})
