import { codeToKeyedTokens } from 'shiki-magic-move/core'
import lz from 'lz-string'
import type { MarkdownTransformContext } from '@slidev/types'
import type { ShikiSetupResult } from '../../setups/shiki'
import { normalizeRangeStr } from './utils'
import { reCodeBlock } from './code-wrapper'

const reMagicMoveBlock = /^````(?:md|markdown) magic-move *(\{[^}]*\})?([^ \n]*)\n([\s\S]+?)^````$/gm

function parseLineNumbersOption(options: string) {
  return /lines: *true/.test(options) ? true : /lines: *false/.test(options) ? false : undefined
}

/**
 * Transform magic-move code blocks
 */
export function transformMagicMove(
  shiki: ShikiSetupResult,
  configLineNumbers: boolean,
) {
  return (ctx: MarkdownTransformContext) => {
    ctx.s.replace(
      reMagicMoveBlock,
      (full, options = '{}', _attrs = '', body: string) => {
        const matches = Array.from(body.matchAll(reCodeBlock))

        if (!matches.length)
          throw new Error('Magic Move block must contain at least one code block')

        const defaultLineNumbers = parseLineNumbersOption(options) ?? configLineNumbers

        const ranges = matches.map(i => normalizeRangeStr(i[2]))
        const steps = matches.map((i) => {
          const lineNumbers = parseLineNumbersOption(i[3]) ?? defaultLineNumbers
          return codeToKeyedTokens(shiki.highlighter, i[5].trimEnd(), {
            ...shiki.options,
            lang: i[1] as any,
          }, lineNumbers)
        })
        const compressed = lz.compressToBase64(JSON.stringify(steps))
        return `<ShikiMagicMove v-bind="${options}" steps-lz="${compressed}" :step-ranges='${JSON.stringify(ranges)}' />`
      },
    )
  }
}
