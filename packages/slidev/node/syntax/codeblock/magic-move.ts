import type { SlideInfo } from '@slidev/types'
import { defineCodeblockTransformer } from '@slidev/types'
import lz from 'lz-string'
import { toKeyedTokens } from 'shiki-magic-move/core'
import { resolveSnippetImport } from '../snippet'
import { normalizeRangeStr } from '../utils'

const RE_MAGIC_MOVE_INFO = /^(?:md|markdown) magic-move\s*(?:\[([^\]]*)\])?\s*(\{[^}]*\})?/
// eslint-disable-next-line regexp/no-super-linear-backtracking
const RE_CODE_BLOCK = /^```([\w'-]+)?(?:[ \t]*|[ \t][ \w\t'-]*)(?:\[([^\]]*)\])?[ \t]*(?:\{([\w*,|-]+)\}[ \t]*(\{[^}]*\})?([^\r\n]*))?\r?\n((?:(?!^```)[\s\S])*?)^```$/gm
const RE_INNER_CODE_FENCE = /^```/
const RE_LINES_TRUE = /\blines: *true\b/
const RE_LINES_FALSE = /\blines: *false\b/

function parseLineNumbersOption(options: string) {
  return RE_LINES_TRUE.test(options) ? true : RE_LINES_FALSE.test(options) ? false : undefined
}

function resolveMagicMoveSnippetImports(code: string, userRoot: string, slide: SlideInfo, watchFiles: Record<string, Set<number>>) {
  let inCodeBlock = false

  return code.split(/\r?\n/).map((line) => {
    if (RE_INNER_CODE_FENCE.test(line)) {
      inCodeBlock = !inCodeBlock
      return line
    }

    if (inCodeBlock)
      return line

    const snippet = resolveSnippetImport(line, userRoot, slide)
    if (!snippet)
      return line

    watchFiles[snippet.src] ??= new Set()
    watchFiles[snippet.src].add(slide.index)

    const info = `${snippet.lang} ${snippet.meta}`.trim()
    const content = snippet.content.endsWith('\n') ? snippet.content : `${snippet.content}\n`
    return `\`\`\`${info}\n${content}\`\`\``
  }).join('\n')
}

export default defineCodeblockTransformer(async ({ info, fence, code, slide, options: { userRoot, data: { config, watchFiles }, utils: { shikiOptions, shiki } } }) => {
  if (fence !== 4)
    return
  const match = info.match(RE_MAGIC_MOVE_INFO)
  if (!match)
    return
  const [, title = '', options = '{}'] = match
  const defaultLineNumbers = parseLineNumbersOption(options) ?? config.lineNumbers
  const resolvedCode = slide ? resolveMagicMoveSnippetImports(code, userRoot, slide, watchFiles) : code
  const matches = Array.from(resolvedCode.matchAll(RE_CODE_BLOCK))
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
