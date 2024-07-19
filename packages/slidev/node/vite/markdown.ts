import Markdown from 'unplugin-vue-markdown/vite'
import type { Plugin } from 'vite'
import type { MarkdownTransformContext, ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import MagicString from 'magic-string-stack'
import { applyMarkdownTransform } from '../syntax/transform'
import { useMarkdownItPlugins } from '../syntax/markdown-it'
import type { ShikiSetupResult } from '../setups/shiki'

export async function createMarkdownPlugin(
  options: ResolvedSlidevOptions,
  { markdown: mdOptions }: SlidevPluginOptions,
  shiki: ShikiSetupResult,
): Promise<Plugin> {
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
    async markdownItSetup(md) {
      await useMarkdownItPlugins(md, options, shiki, markdownTransformMap)
      await mdOptions?.markdownItSetup?.(md)
    },
    transforms: {
      ...mdOptions?.transforms,
      before(code, id) {
        if (id === options.entry)
          return ''

        const ctx: MarkdownTransformContext = {
          s: new MagicString(code),
          id,
          options,
        }

        applyMarkdownTransform(ctx, shiki)
        markdownTransformMap.set(id, ctx.s)

        const s = ctx.s.toString()
        return mdOptions?.transforms?.before?.(s, id) ?? s
      },
    },
  }) as Plugin
}
