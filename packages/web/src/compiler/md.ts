import { unpluginFactory } from 'unplugin-vue-markdown'
import type { UnpluginOptions } from 'unplugin'
import { computed } from 'vue'
import { taskLists as MarkdownItTaskList } from '@hedgedoc/markdown-it-plugins'
import MarkdownItMdc from 'markdown-it-mdc'
// @ts-expect-error missing types
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItKatex from '@slidev/cli/node/syntax/markdown-it/markdown-it-katex'
// import MarkdownItVDrag from '@slidev/cli/node/syntax/markdown-it/markdown-it-v-drag'
// import MarkdownItShiki from '@slidev/cli/node/syntax/markdown-it/markdown-it-shiki'
import MarkdownItLink from '@slidev/cli/node/syntax/markdown-it/markdown-it-link'
import MarkdownItEscapeInlineCode from '@slidev/cli/node/syntax/markdown-it/markdown-it-escape-code'
import type { MarkdownTransformContext } from '@slidev/types'
import MagicString from 'magic-string-stack'
import { regexSlideSourceId } from '@slidev/cli/node/vite/common'
import { transformMonaco } from '@slidev/cli/node/syntax/transform/monaco'
import { transformCodeWrapper } from '@slidev/cli/node/syntax/transform/code-wrapper'
import { transformPageCSS } from '@slidev/cli/node/syntax/transform/in-page-css'
import { transformKaTexWrapper } from '@slidev/cli/node/syntax/transform/katex-wrapper'
// import { transformMagicMove } from '@slidev/cli/node/syntax/transform/magic-move'
import { transformMermaid } from '@slidev/cli/node/syntax/transform/mermaid'
// import { transformPlantUml } from '@slidev/cli/node/syntax/transform/plant-uml'
import { transformSlotSugar } from '@slidev/cli/node/syntax/transform/slot-sugar'
// import { transformSnippet } from '@slidev/cli/node/syntax/transform/snippet'
import { slidesInfo } from '../slides'
import { mdOptions } from '../configs/plugins'
import type { CompileResult } from './file'
import { compileVue } from './vue'

const transformers = computed(() => [
  // transformSnippet,
  // transformMagicMove,

  transformMermaid,
  // transformPlantUml,
  transformMonaco,

  transformCodeWrapper,
  transformKaTexWrapper,
  transformPageCSS,
  transformSlotSugar,
])

const plugin = computed(() => {
  const markdownTransformMap = new Map<string, MagicString>()
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
      // md.use(await MarkdownItShiki(options))

      md.use(MarkdownItLink)
      md.use(MarkdownItEscapeInlineCode)
      md.use(MarkdownItFootnote)
      md.use(MarkdownItTaskList, { enabled: true, lineNumber: true, label: true })

      md.use(MarkdownItKatex, [])
      // md.use(MarkdownItVDrag, markdownTransformMap)

      md.use(MarkdownItMdc)

      await mdOptions?.markdownItSetup?.(md)
    },
    transforms: {
      ...mdOptions?.transforms,
      before(code, id) {
        code = mdOptions?.transforms?.before?.(code, id) ?? code

        const match = id.match(regexSlideSourceId)
        if (!match)
          return code

        const s = new MagicString(code)
        markdownTransformMap.set(id, s)
        const ctx: MarkdownTransformContext = {
          s,
          slide: slidesInfo.value[+match[1] - 1],
          options: {
            data: {
              config: {
                monaco: true,
              },
            },
          } as any,
        }

        for (const transformer of transformers.value) {
          if (!transformer)
            continue
          transformer(ctx)
          if (!ctx.s.isEmpty())
            ctx.s.commit()
        }

        return s.toString()
      },
    },
  }, {
    framework: 'vite',
  }) as UnpluginOptions
})

export async function compileMd(filename: string, code: string): Promise<CompileResult> {
  const vue = (await (plugin.value.transform?.call({
    error: console.error,
  } as any, code, filename)) as any).code
  return await compileVue(filename, vue)
}
