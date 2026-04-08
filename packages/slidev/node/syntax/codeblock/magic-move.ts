import { defineCodeblockTransformer } from '@slidev/types'
import lz from 'lz-string'
import { toKeyedTokens } from 'shiki-magic-move/core'
import { normalizeRangeStr } from '../utils'

const RE_MAGIC_MOVE_INFO = /^(?:md|markdown) magic-move\s*(?:\[([^\]]*)\])?\s*(\{[^}]*\})?/
// eslint-disable-next-line regexp/no-super-linear-backtracking
const RE_CODE_BLOCK = /^```([\w'-]+)?(?:[ \t]*|[ \t][ \w\t'-]*)(?:\[([^\]]*)\])?[ \t]*(?:\{([\w*,|-]+)\}[ \t]*(\{[^}]*\})?([^\r\n]*))?\r?\n((?:(?!^```)[\s\S])*?)^```$/gm

function parseLineNumbersOption(options: string) {
  return /\blines: *true\b/.test(options) ? true : /\blines: *false\b/.test(options) ? false : undefined
}

export default defineCodeblockTransformer(async ({ info, fence, code, options: { data: { config }, utils: { shikiOptions, shiki } } }) => {
  if (fence !== 4)
    return
  const match = info.match(RE_MAGIC_MOVE_INFO)
  if (!match)
    return
  const [, title = '', options = '{}'] = match
  const defaultLineNumbers = parseLineNumbersOption(options) ?? config.lineNumbers
  const matches = Array.from(code.matchAll(RE_CODE_BLOCK))
  if (!matches.length)
    throw new Error('Magic Move block must contain at least one code block')

  const ranges = matches.map(i => normalizeRangeStr(i[3]))
  const steps = await Promise.all(matches.map(async (i) => {
    const lang = i[1]
    const lineNumbers = parseLineNumbersOption(i[4]) ?? defaultLineNumbers
    const code = i[6].trimEnd()
    const options = {
      ...shikiOptions,
      lang,
    }
    const { tokens, bg, fg, rootStyle, themeName } = await shiki.codeToTokens(code, options)
    return {
      ...toKeyedTokens(code, tokens, JSON.stringify([lang, 'themes' in options ? options.themes : options.theme]), lineNumbers),
      bg,
      fg,
      rootStyle,
      themeName,
      lang,
    }
  }))
  const compressed = lz.compressToBase64(JSON.stringify(steps))
  return `<ShikiMagicMove v-bind="${options}" steps-lz="${compressed}" :title='${JSON.stringify(title)}' :step-ranges='${JSON.stringify(ranges)}' />`
})
