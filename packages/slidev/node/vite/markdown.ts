import type { MarkdownTransformContext, ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import MagicString from 'magic-string-stack'
import Markdown from 'unplugin-vue-markdown/vite'
import { useMarkdownItPlugins } from '../syntax/markdown-it'
import { getMarkdownTransformers } from '../syntax/transform'
import { regexSlideSourceId } from './common'

export async function createMarkdownPlugin(
  options: ResolvedSlidevOptions,
  { markdown: mdOptions }: SlidevPluginOptions,
): Promise<Plugin> {
  const markdownTransformMap = new Map<string, MagicString>()
  const transformers = await getMarkdownTransformers(options)

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
      await useMarkdownItPlugins(md, options, markdownTransformMap)
      await mdOptions?.markdownItSetup?.(md)
    },
    transforms: {
      ...mdOptions?.transforms,
      before(code, id) {
        // Skip entry Markdown files
        if (options.data.markdownFiles[id])
          return ''

        code = mdOptions?.transforms?.before?.(code, id) ?? code

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
          transformer(ctx)
          if (!ctx.s.isEmpty())
            ctx.s.commit()
        }

        return s.toString()
      },
    },
  }) as Plugin
}
