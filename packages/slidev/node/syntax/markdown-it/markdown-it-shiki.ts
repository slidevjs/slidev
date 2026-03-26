import type { ResolvedSlidevOptions } from '@slidev/types'
import type { MarkdownExit } from 'markdown-exit'
import type { ShikiTransformer } from 'shiki'
import { isTruthy } from '@antfu/utils'
import { fromAsyncCodeToHtml } from '@shikijs/markdown-it/async'
import lz from 'lz-string'
import { escapeVueInCode, normalizeRangeStr } from '../transform/utils'

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
    {
      pre(pre) {
        this.addClassToHast(pre, 'slidev-code')
        delete pre.properties.tabindex
      },
    } satisfies ShikiTransformer,
  ].filter(isTruthy) as ShikiTransformer[]

  const highlighterPlugin = fromAsyncCodeToHtml(shiki.codeToHtml, {
    ...shikiOptions,
    transformers,
  })

  const monacoEnabled = config.monaco === true || config.monaco === mode

  return (md: MarkdownExit) => {
    // @ts-expect-error @shikijs/markdown-it types expect MarkdownItAsync, but MarkdownExit is API-compatible
    md.use(highlighterPlugin)

    // Apply CodeBlockWrapper
    const oldFence = md.renderer.rules.fence
    md.renderer.rules.fence = async function (tokens, idx, renderOptions, env, slf) {
      const token = tokens[idx]
      const { monaco, lang, title, ranges, options, rest } = parseMetaString(token.info)
      const optionsProp = options ? `v-bind="${options}"` : ''
      token.info = `${lang} ${rest}`

      if (monaco) {
        if (!monacoEnabled) {
          return oldFence?.(tokens, idx, renderOptions, env, slf) || ''
        }

        let encoded, diff
        if (monaco === 'monaco-diff') {
          const [code, diffStr] = token.content.split(/^\s*~~~\s*\n/m, 2)
          encoded = lz.compressToBase64(code)
          diff = diffStr === undefined ? '' : `diff-lz="${lz.compressToBase64(diffStr)}"`
        }
        else {
          encoded = lz.compressToBase64(token.content)
        }

        const runnable = monaco === 'monaco-run' ? 'runnable' : ''
        return `<Monaco ${optionsProp} ${runnable} lang="${lang}" code-lz="${encoded}" ${diff} />`
      }

      token.info = rest
      const code = await oldFence?.(tokens, idx, renderOptions, env, slf) || ''
      return `<CodeBlockWrapper ${optionsProp} title=${JSON.stringify(title)} :ranges='${JSON.stringify(ranges)}'>${escapeVueInCode(code)}</CodeBlockWrapper>`
    }
  }
}

const META_RE = /([\w'-]+)?(?:[ \t]*|[ \t][ \w\t'-]*)(?:\[([^\]]*)\])?[ \t]*(?:\{([\w*,|-]+)\}[ \t]*(\{[^}]*\})?([^\r\n]*))?/

function parseMetaString(meta: string) {
  const [, lang = '', title = '', rangeStr = '', options = '', rest = ''] = meta.trim().match(META_RE) ?? []

  if (title === '' && rangeStr.startsWith('monaco')) {
    return { monaco: rangeStr, lang, options, rest }
  }

  const ranges = normalizeRangeStr(rangeStr)
  return { title, ranges, options, rest }
}
