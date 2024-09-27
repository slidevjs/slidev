import type { ResolvedSlidevOptions } from '@slidev/types'
import type MagicString from 'magic-string'
import type MarkdownIt from 'markdown-it'
import { taskLists as MarkdownItTaskList } from '@hedgedoc/markdown-it-plugins'
import MarkdownItMdc from 'markdown-it-mdc'
// @ts-expect-error missing types
import MarkdownItFootnote from 'markdown-it-footnote'
import setupKatex from '../../setups/katex'
import MarkdownItEscapeInlineCode from './markdown-it-escape-code'
import MarkdownItKatex from './markdown-it-katex'
import MarkdownItLink from './markdown-it-link'
import MarkdownItShiki from './markdown-it-shiki'
import MarkdownItVDrag from './markdown-it-v-drag'

export async function useMarkdownItPlugins(md: MarkdownIt, options: ResolvedSlidevOptions, markdownTransformMap: Map<string, MagicString>) {
  const { roots, data: { features, config } } = options

  if (config.highlighter === 'shiki') {
    md.use(await MarkdownItShiki(options))
  }

  md.use(MarkdownItLink)
  md.use(MarkdownItEscapeInlineCode)
  md.use(MarkdownItFootnote)
  md.use(MarkdownItTaskList, { enabled: true, lineNumber: true, label: true })
  if (features.katex)
    md.use(MarkdownItKatex, await setupKatex(roots))
  md.use(MarkdownItVDrag, markdownTransformMap)
  if (config.mdc)
    md.use(MarkdownItMdc)
}
