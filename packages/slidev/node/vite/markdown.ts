import Markdown from 'unplugin-vue-markdown/vite'
import type { Plugin } from 'vite'
import { isTruthy, slash } from '@antfu/utils'
import type { KatexOptions } from 'katex'
import type MarkdownIt from 'markdown-it'
import { taskLists as MarkdownItTaskList } from '@hedgedoc/markdown-it-plugins'
import MarkdownItMdc from 'markdown-it-mdc'
import type { MarkdownItShikiOptions } from '@shikijs/markdown-it'
import type { Highlighter, ShikiTransformer } from 'shiki'
import MagicString from 'magic-string-stack'
// @ts-expect-error missing types
import MarkdownItLinkAttrs from 'markdown-it-link-attributes'
// @ts-expect-error missing types
import MarkdownItFootnote from 'markdown-it-footnote'

import type { MarkdownTransformContext, MarkdownTransformer, ResolvedSlidevOptions, SlidevConfig, SlidevPluginOptions } from '@slidev/types'
import MarkdownItKatex from '../syntax/markdown-it/markdown-it-katex'
import MarkdownItPrism from '../syntax/markdown-it/markdown-it-prism'
import MarkdownItVDrag from '../syntax/markdown-it/markdown-it-v-drag'

import { loadShikiSetups } from '../setups/shiki'
import { loadSetups } from '../setups/load'
import { escapeVueInCode } from '../syntax/transform/utils'

import {
  transformCodeWrapper,
  transformKaTexWrapper,
  transformMagicMove,
  transformMermaid,
  transformMonaco,
  transformPageCSS,
  transformPlantUml,
  transformSlotSugar,
  transformSnippet,
} from '../syntax/transform'

export async function createMarkdownPlugin(
  options: ResolvedSlidevOptions,
  { markdown: mdOptions }: SlidevPluginOptions,
): Promise<Plugin> {
  const { data: { config }, roots, mode, entry, clientRoot } = options

  const setups: ((md: MarkdownIt) => void)[] = []
  const entryPath = slash(entry)

  let shiki: Highlighter | undefined
  let shikiOptions: MarkdownItShikiOptions | undefined

  if (config.highlighter === 'shiki') {
    const result = await createMarkdownItShiki(clientRoot, roots, config, mode)
    shiki = result.shiki
    shikiOptions = result.shikiOptions
    setups.push(md => md.use(result.plugin))
  }
  else {
    console.warn('[Slidev] Highlighter: Prism highlighter is deprecated, and will be removed in v0.50. Refer to https://github.com/slidevjs/slidev/issues/1390')
    setups.push(md => md.use(MarkdownItPrism))
  }

  if (config.mdc)
    setups.push(md => md.use(MarkdownItMdc))

  const KatexOptions: KatexOptions = await loadSetups(options.clientRoot, roots, 'katex.ts', {}, { strict: false }, false)

  const markdownTransformMap = new Map<string, MagicString>()

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
      md.use(MarkdownItLinkAttrs, {
        matcher(href: string) {
          return !'/#.'.includes(href[0])
        },
        attrs: {
          target: "_blank",
        },
      })
      md.use(MarkdownItEscapeInlineCode)
      md.use(MarkdownItFootnote)
      md.use(MarkdownItTaskList, { enabled: true, lineNumber: true, label: true })
      md.use(MarkdownItKatex, KatexOptions)
      md.use(MarkdownItVDrag, markdownTransformMap)

      setups.forEach(i => i(md))
      mdOptions?.markdownItSetup?.(md)
    },
    transforms: {
      before(code, id) {
        if (id === entryPath)
          return ''

        const ctx: MarkdownTransformContext = {
          s: new MagicString(code),
          id,
          options,
        }

        applyMarkdownTransform(ctx, shiki, shikiOptions)
        markdownTransformMap.set(id, ctx.s)
        return ctx.s.toString()
      },
    },
  }) as Plugin
}

async function createMarkdownItShiki(clientRoot: string, roots: string[], config: SlidevConfig, mode: string) {
  const [
    shikiOptions,
    { getHighlighter, bundledLanguages },
    markdownItShiki,
    transformerTwoslash,
  ] = await Promise.all([
    loadShikiSetups(clientRoot, roots),
    import('shiki').then(({ getHighlighter, bundledLanguages }) => ({ bundledLanguages, getHighlighter })),
    import('@shikijs/markdown-it/core').then(({ fromHighlighter }) => fromHighlighter),
    import('@shikijs/vitepress-twoslash').then(({ transformerTwoslash }) => transformerTwoslash),
  ] as const)

  const shiki = await getHighlighter({
    ...shikiOptions as any,
    langs: shikiOptions.langs ?? Object.keys(bundledLanguages),
    themes: 'themes' in shikiOptions ? Object.values(shikiOptions.themes) : [shikiOptions.theme],
  })

  const twoslashEnabled = (config.twoslash === true || config.twoslash === mode)

  const transformers = [
    ...shikiOptions.transformers || [],
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
    ...shikiOptions,
    transformers,
  })

  return {
    shiki,
    shikiOptions,
    plugin,
  }
}

function MarkdownItEscapeInlineCode(md: MarkdownIt) {
  const codeInline = md.renderer.rules.code_inline!
  md.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
    const result = codeInline(tokens, idx, options, env, self)
    return result.replace(/^<code/, '<code v-pre')
  }
}

export function applyMarkdownTransform(
  ctx: MarkdownTransformContext,
  shiki?: Highlighter,
  shikiOptions?: MarkdownItShikiOptions,
) {
  const transformers: (MarkdownTransformer | undefined)[] = [
    transformSnippet,
    ctx.options.data.config.highlighter
      ? transformMagicMove(shiki, shikiOptions)
      : undefined,
    transformMermaid,
    transformPlantUml,
    transformMonaco,
    transformCodeWrapper,
    transformKaTexWrapper,
    transformPageCSS,
    transformSlotSugar,
  ]

  for (const transformer of transformers) {
    if (!transformer)
      continue
    transformer(ctx)
    if (!ctx.s.isEmpty())
      ctx.s.commit()
  }

  return ctx
}
