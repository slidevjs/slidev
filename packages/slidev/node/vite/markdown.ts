import Markdown from 'unplugin-vue-markdown/vite'
import type { Plugin } from 'vite'
import { isTruthy, slash } from '@antfu/utils'
import type { KatexOptions } from 'katex'
import type MarkdownIt from 'markdown-it'
import { taskLists as MarkdownItTaskList } from '@hedgedoc/markdown-it-plugins'
import MarkdownItMdc from 'markdown-it-mdc'
import type { MarkdownItShikiOptions } from '@shikijs/markdown-it'
import type { Highlighter, ShikiTransformer } from 'shiki'
import MagicString from 'magic-string'

// @ts-expect-error missing types
import MarkdownItAttrs from 'markdown-it-link-attributes'

// @ts-expect-error missing types
import MarkdownItFootnote from 'markdown-it-footnote'

import type { MarkdownTransformContext, ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import MarkdownItKatex from '../syntax/markdown-it/markdown-it-katex'
import MarkdownItPrism from '../syntax/markdown-it/markdown-it-prism'
import MarkdownItVDrag from '../syntax/markdown-it/markdown-it-v-drag'

import { loadShikiSetups } from '../setups/shiki'
import { loadSetups } from '../setups/load'
import { transformCodeWrapper, transformKaTexWrapper, transformMagicMove, transformMermaid, transformMonaco, transformPageCSS, transformPlantUml, transformSlotSugar, transformSnippet } from '../syntax/transform'
import { escapeVueInCode } from '../syntax/transform/utils'

let shiki: Highlighter | undefined
let shikiOptions: MarkdownItShikiOptions | undefined

export async function createMarkdownPlugin(
  options: ResolvedSlidevOptions,
  { markdown: mdOptions }: SlidevPluginOptions,
): Promise<Plugin> {
  const { data: { config }, roots, mode, entry, clientRoot } = options

  const setups: ((md: MarkdownIt) => void)[] = []
  const entryPath = slash(entry)

  if (config.highlighter === 'shiki') {
    const [
      options,
      { getHighlighter, bundledLanguages },
      markdownItShiki,
      transformerTwoslash,
    ] = await Promise.all([
      loadShikiSetups(clientRoot, roots),
      import('shiki').then(({ getHighlighter, bundledLanguages }) => ({ bundledLanguages, getHighlighter })),
      import('@shikijs/markdown-it/core').then(({ fromHighlighter }) => fromHighlighter),
      import('@shikijs/vitepress-twoslash').then(({ transformerTwoslash }) => transformerTwoslash),
    ] as const)

    shikiOptions = options
    shiki = await getHighlighter({
      ...options as any,
      langs: options.langs ?? Object.keys(bundledLanguages),
      themes: 'themes' in options ? Object.values(options.themes) : [options.theme],
    })

    const twoslashEnabled = (config.twoslash === true || config.twoslash === mode)

    const transformers = [
      ...options.transformers || [],
      twoslashEnabled && transformerTwoslash({
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
      } as ShikiTransformer,
    ].filter(isTruthy) as ShikiTransformer[]

    const plugin = markdownItShiki(shiki, {
      ...options,
      transformers,
    })
    setups.push(md => md.use(plugin))
  }
  else {
    setups.push(md => md.use(MarkdownItPrism))
  }

  if (config.mdc)
    setups.push(md => md.use(MarkdownItMdc))

  const KatexOptions: KatexOptions = await loadSetups(options.clientRoot, roots, 'katex.ts', {}, { strict: false }, false)

  return Markdown({
    include: [/\.md$/],
    wrapperClasses: '',
    headEnabled: false,
    frontmatter: false,
    escapeCodeTagInterpolation: false,
    markdownItOptions: {
      quotes: '""\'\'',
      html: true,
      xhtmlOut: true,
      linkify: true,
      ...mdOptions?.markdownItOptions,
    },
    ...mdOptions,
    markdownItSetup(md) {
      md.use(MarkdownItAttrs, {
        attrs: {
          target: '_blank',
          rel: 'noopener',
        },
      })

      md.use(MarkdownItFootnote)
      md.use(MarkdownItTaskList, { enabled: true, lineNumber: true, label: true })
      md.use(MarkdownItKatex, KatexOptions)
      md.use(MarkdownItVDrag)

      setups.forEach(i => i(md))
      mdOptions?.markdownItSetup?.(md)
    },
    transforms: {
      before(code, id) {
        if (id === entryPath)
          return ''

        const monacoEnabled = (config.monaco === true || config.monaco === mode)

        const ctx: MarkdownTransformContext = {
          s: new MagicString(code),
          ignores: [],
          isIgnored(index) {
            return index < 0 || ctx.ignores.some(([start, end]) => start <= index && index < end)
          },
        }

        transformSnippet(ctx, options, id)

        if (config.highlighter === 'shiki')
          transformMagicMove(ctx, shiki, shikiOptions)

        transformMermaid(ctx)
        transformPlantUml(ctx, config.plantUmlServer)
        transformMonaco(ctx, monacoEnabled)
        transformCodeWrapper(ctx)
        transformKaTexWrapper(ctx)

        transformPageCSS(ctx, id)
        transformSlotSugar(ctx)

        return ctx.s.toString()
      },
    },
  }) as Plugin
}
