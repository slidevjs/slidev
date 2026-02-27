import type { ResolvedSlidevOptions } from '@slidev/types'
import type MagicString from 'magic-string'
import type MarkdownExit from 'markdown-exit'
import { taskLists as MarkdownItTaskList } from '@hedgedoc/markdown-it-plugins'
// @ts-expect-error missing types
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItMdc from 'markdown-it-mdc'
import MarkdownItEscapeInlineCode from './markdown-it-escape-code'
import MarkdownItKatex from './markdown-it-katex'
import MarkdownItLink from './markdown-it-link'
import MarkdownItShiki from './markdown-it-shiki'
import MarkdownItVDrag from './markdown-it-v-drag'

export async function useMarkdownItPlugins(md: MarkdownExit, options: ResolvedSlidevOptions, markdownTransformMap: Map<string, MagicString>) {
  const { data: { features, config }, utils: { katexOptions } } = options

  if (config.highlighter === 'shiki') {
    // @ts-expect-error @shikijs/markdown-it types expect MarkdownItAsync, but MarkdownExit is API-compatible
    md.use(await MarkdownItShiki(options))
  }

  md.use(MarkdownItLink)
  md.use(MarkdownItEscapeInlineCode)
  md.use(MarkdownItFootnote)
  md.use(MarkdownItTaskList, { enabled: true, lineNumber: true, label: true })
  if (features.katex)
    md.use(MarkdownItKatex, katexOptions)
  md.use(MarkdownItVDrag, markdownTransformMap)
  if (config.mdc)
    md.use(MarkdownItMdc)
}
