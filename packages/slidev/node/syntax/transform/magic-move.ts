import type { MarkdownItShikiOptions } from '@shikijs/markdown-it'
import type { Highlighter } from 'shiki'
import { codeToKeyedTokens } from 'shiki-magic-move/core'
import lz from 'lz-string'
import type { MarkdownTransformContext } from '@slidev/types'
import { normalizeRangeStr } from './utils'
import { reCodeBlock } from './code-wrapper'

// eslint-disable-next-line regexp/no-useless-quantifier, regexp/no-super-linear-backtracking
const reMagicMoveBlock = /^````(?:md|markdown) magic-move(?: *(\{[^}]*\})?([^\n]*))?\n([\s\S]+?)^````$/gm

function parseLineNumbersOption(options: string) {
  return /lines: *true/.test(options) ? true : /lines: *false/.test(options) ? false : undefined
}

/**
 * Transform magic-move code blocks
 */
export function transformMagicMove(
  shiki: Highlighter | undefined,
  shikiOptions: MarkdownItShikiOptions | undefined,
  configLineNumbers: boolean,
) {
  return (ctx: MarkdownTransformContext) => {
    ctx.s.replace(
      reMagicMoveBlock,
      (full, options = '{}', _attrs = '', body: string) => {
        if (!shiki || !shikiOptions)
          throw new Error('Shiki is required for Magic Move. You may need to set `highlighter: shiki` in your Slidev config.')

        const matches = Array.from(body.matchAll(reCodeBlock))

        if (!matches.length)
          throw new Error('Magic Move block must contain at least one code block')

        const defaultLineNumbers = parseLineNumbersOption(options) ?? configLineNumbers

        const ranges = matches.map(i => normalizeRangeStr(i[2]))
        const steps = matches.map((i) => {
          const lineNumbers = parseLineNumbersOption(i[3]) ?? defaultLineNumbers
          return codeToKeyedTokens(shiki, i[5].trimEnd(), {
            ...shikiOptions,
            lang: i[1] as any,
          }, lineNumbers)
        })
        const compressed = lz.compressToBase64(JSON.stringify(steps))
        return `<ShikiMagicMove v-bind="${options}" steps-lz="${compressed}" :step-ranges='${JSON.stringify(ranges)}' />`
      },
    )
  }
}
