import type MagicString from 'magic-string-stack'
import type { ResolvedSlidevOptions } from './options'
import type { SlideInfo } from './types'

export interface MarkdownTransformContext {
  /**
   * The magic string instance for the current markdown content
   */
  s: MagicString

  /**
   * The slide info of the current slide
   */
  slide: SlideInfo

  /**
   * Resolved Slidev options
   */
  options: ResolvedSlidevOptions
}

export type MarkdownTransformer = (ctx: MarkdownTransformContext) => void
