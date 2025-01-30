import type { MarkdownTransformContext } from '@slidev/types'
import lz from 'lz-string'
import { toKeyedTokens } from 'shiki-magic-move/core'
import { reCodeBlock } from './code-wrapper'
import { normalizeRangeStr } from './utils'

const reMagicMoveBlock = /^````(?:md|markdown) magic-move *(\{[^}]*\})?([^ \n]*)\n([\s\S]+?)^````$/gm

function parseLineNumbersOption(options: string) {
  return /lines: *true/.test(options) ? true : /lines: *false/.test(options) ? false : undefined
}

/**
 * Transform magic-move code blocks
 */
export async function transformMagicMove(ctx: MarkdownTransformContext) {
  const { codeToTokens } = ctx.options.utils.shiki
  const replacements: [number, number, Promise<string>][] = []

  ctx.s.replace(
    reMagicMoveBlock,
    (full, options = '{}', _attrs = '', body: string, start: number) => {
      const end = start + full.length
      replacements.push([start, end, worker()])
      return ''
      async function worker() {
        const matches = Array.from(body.matchAll(reCodeBlock))

        if (!matches.length)
          throw new Error('Magic Move block must contain at least one code block')

        const defaultLineNumbers = parseLineNumbersOption(options) ?? ctx.options.data.config.lineNumbers

        const ranges = matches.map(i => normalizeRangeStr(i[2]))
        const steps = await Promise.all(matches.map(async (i) => {
          const lang = i[1]
          const lineNumbers = parseLineNumbersOption(i[3]) ?? defaultLineNumbers
          const code = i[5].trimEnd()
          const options = {
            ...ctx.options.utils.shikiOptions,
            lang,
          }
          const { tokens } = await codeToTokens(code, options)
          return toKeyedTokens(code, tokens, JSON.stringify([lang, 'themes' in options ? options.themes : options.theme]), lineNumbers)
        }))
        const compressed = lz.compressToBase64(JSON.stringify(steps))
        return `<ShikiMagicMove v-bind="${options}" steps-lz="${compressed}" :step-ranges='${JSON.stringify(ranges)}' />`
      }
    },
  )

  for (const [start, end, content] of replacements) {
    // magic-string internally uses `overwrite` instead of `update` in the `replace` method
    ctx.s.overwrite(start, end, await content)
  }
}
