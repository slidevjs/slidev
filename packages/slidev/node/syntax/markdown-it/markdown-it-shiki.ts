import { isTruthy } from '@antfu/utils'
import type { ResolvedSlidevOptions } from '@slidev/types'
import type { HighlighterGeneric, ShikiTransformer } from 'shiki'
import { fromHighlighter } from '@shikijs/markdown-it/core'
import type { MarkdownItShikiOptions } from '@shikijs/markdown-it'
import { escapeVueInCode } from '../transform/utils'
import type { ShikiSetupResult } from '../../setups/shiki'

export default async function MarkdownItShiki({ data: { config }, mode }: ResolvedSlidevOptions, shiki: ShikiSetupResult) {
  const transformers = [
    ...shiki.options.transformers || [],
    (config.twoslash === true || config.twoslash === mode)
    && (await import('@shikijs/vitepress-twoslash')).transformerTwoslash({
      explicitTrigger: true,
      twoslashOptions: {
        handbookOptions: {
          noErrorValidation: true,
        },
      },
    }),
    {
      pre(pre) {
        this.addClassToHast(pre, 'slidev-code')
        delete pre.properties.tabindex
      },
      postprocess(code) {
        return escapeVueInCode(code)
      },
    } satisfies ShikiTransformer,
  ].filter(isTruthy) as ShikiTransformer[]

  return fromHighlighter(shiki.highlighter, {
    ...shiki.options,
    transformers,
  })
}
