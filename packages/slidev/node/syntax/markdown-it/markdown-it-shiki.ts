import type { ResolvedSlidevOptions } from '@slidev/types'
import type { ShikiTransformer } from 'shiki'
import { isTruthy } from '@antfu/utils'
import { fromAsyncCodeToHtml } from '@shikijs/markdown-it/async'
import { escapeVueInCode } from '../transform/utils'

export default async function MarkdownItShiki({ data: { config }, mode, utils }: ResolvedSlidevOptions) {
  const transformers = [
    ...utils.shikiOptions.transformers || [],
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

  return fromAsyncCodeToHtml(utils.shiki.codeToHtml, {
    ...utils.shikiOptions,
    transformers,
  })
}
