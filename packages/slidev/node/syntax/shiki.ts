import type { ResolvedSlidevOptions } from '@slidev/types'
import type { ShikiTransformer } from 'shiki'
import { isTruthy } from '@antfu/utils'
import { fromAsyncCodeToHtml } from '@shikijs/markdown-it/async'

export default async function MarkdownItShiki({ data: { config }, mode, utils: { shiki, shikiOptions } }: ResolvedSlidevOptions) {
  async function getTwoslashTransformer() {
    const [, , { transformerTwoslash }] = await Promise.all([
      // trigger shiki to load the langs
      shiki.codeToHast('', { lang: 'js', ...shikiOptions }),
      shiki.codeToHast('', { lang: 'ts', ...shikiOptions }),

      import('@shikijs/vitepress-twoslash'),
    ])
    return transformerTwoslash({
      explicitTrigger: true,
      twoslashOptions: {
        handbookOptions: {
          noErrorValidation: true,
        },
      },
    })
  }

  const transformers = [
    ...shikiOptions.transformers || [],
    (config.twoslash === true || config.twoslash === mode) && await getTwoslashTransformer(),
    (config.twoslash === true || config.twoslash === mode) && transformerTwoslashConditional(),
    {
      pre(pre) {
        this.addClassToHast(pre, 'slidev-code')
        delete pre.properties.tabindex
      },
    } satisfies ShikiTransformer,
  ].filter(isTruthy) as ShikiTransformer[]

  return fromAsyncCodeToHtml(shiki.codeToHtml, {
    ...shikiOptions,
    transformers,
  })
}

// Fix #2202
function transformerTwoslashConditional(): ShikiTransformer {
  return {
    name: 'slidev:twoslash-conditional',
    code: function applyConditionalFlag(this: any, node) {
      if (node.tagName === 'v-menu') {
        if (node.properties[':shown'] === 'true')
          node.properties[':shown'] = '$nav.currentPage === $page'
      }
      else {
        for (const child of node.children) {
          if (child.type === 'element')
            applyConditionalFlag(child)
        }
      }
    },
  }
}
