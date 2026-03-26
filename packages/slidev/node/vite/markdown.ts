import type { MarkdownTransformContext, ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import MagicString from 'magic-string-stack'
import Markdown from 'unplugin-vue-markdown/vite'
import setupTransformers from '../setups/transformers'
import { useMarkdownItPlugins } from '../syntax/markdown-it'
import { regexSlideSourceId } from './common'

export async function createMarkdownPlugin(
  options: ResolvedSlidevOptions,
  { markdown: mdOptions }: SlidevPluginOptions,
): Promise<Plugin> {
  const markdownTransformMap = new Map<string, MagicString>()
  const extras = await setupTransformers(options.roots)
  const transformers = [
    ...extras.pre,
    ...extras.preCodeblock,
    ...extras.postCodeblock,
    ...extras.post,
  ]

  return Markdown({
    include: [/\.md$/],
    wrapperClasses: '',
    headEnabled: false,
    frontmatter: false,
    escapeCodeTagInterpolation: false,
    markdownOptions: {
      quotes: '""\'\'',
      html: true,
      xhtmlOut: true,
      linkify: true,
      ...mdOptions?.markdownOptions,
    },
    ...mdOptions,
    async markdownSetup(md) {
      await useMarkdownItPlugins(md, options, markdownTransformMap, extras.codeblocks)
      await mdOptions?.markdownSetup?.(md)
    },
    transforms: {
      ...mdOptions?.transforms,
      async before(code, id) {
        // Skip entry Markdown files
        if (options.data.markdownFiles[id])
          return ''

        code = await mdOptions?.transforms?.before?.(code, id) ?? code

        const match = id.match(regexSlideSourceId)
        if (!match)
          return code

        const s = new MagicString(code)
        markdownTransformMap.set(id, s)
        const ctx: MarkdownTransformContext = {
          s,
          slide: options.data.slides[+match[1] - 1],
          options,
        }

        for (const transformer of transformers) {
          if (!transformer)
            continue
          await transformer(ctx)
          if (!ctx.s.isEmpty())
            ctx.s.commit()
        }

        return s.toString()
      },
    },
  }) as Plugin
}
