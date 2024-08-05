import { unpluginFactory } from 'unplugin-vue-markdown'
import type { UnpluginOptions } from 'unplugin'
import { computed } from 'vue'
import { mdOptions } from '../configs/plugins'
import type { CompileResult } from './file'
import { compileVue } from './vue'

const plugin = computed(() => {
  return unpluginFactory({
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
      // await useMarkdownItPlugins(md, options, markdownTransformMap)
      await mdOptions?.markdownItSetup?.(md)
    },
    transforms: {
      ...mdOptions?.transforms,
      //   before(code, id) {
      //     // Skip entry Markdown files
      //     if (options.data.markdownFiles[id])
      //       return ''

      //     code = mdOptions?.transforms?.before?.(code, id) ?? code

      //     const match = id.match(regexSlideSourceId)
      //     if (!match)
      //       return code

      //     const s = new MagicString(code)
      //     markdownTransformMap.set(id, s)
      //     const ctx: MarkdownTransformContext = {
      //       s,
      //       slide: options.data.slides[+match[1] - 1],
      //       options,
      //     }

      //     for (const transformer of transformers) {
      //       if (!transformer)
      //         continue
      //       transformer(ctx)
      //       if (!ctx.s.isEmpty())
      //         ctx.s.commit()
      //     }

    //     return s.toString()
    //   },
    },
  }, {
    framework: 'vite',
  }) as UnpluginOptions
})

export async function compileMd(filename: string, code: string): Promise<CompileResult> {
  const vue = ((await plugin.value.transform?.call({} as any, code, 'file.md')) as any).code
  return compileVue(filename, vue)
}
