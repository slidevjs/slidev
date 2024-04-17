import type MagicString from 'magic-string-stack'
import type { ResolvedSlidevOptions } from './options'

export interface MarkdownTransformContext {
  s: MagicString
  id: string
  options: ResolvedSlidevOptions
}

export type MarkdownTransformer = (ctx: MarkdownTransformContext) => void
