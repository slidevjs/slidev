import type { Awaitable } from '@antfu/utils'
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

export type MarkdownTransformer = (ctx: MarkdownTransformContext) => Awaitable<void>

export interface CodeblockTransformContext {
  /**
   * The language and meta info of the code block, i.e., the content after "```"
   */
  info: string

  /**
   * The content of the code block
   */
  code: string

  /**
   * Get the highlighted code HTML.
   */
  renderHighlighted: (override: { info?: string, code?: string }) => Awaitable<string>

  /**
   * The number of "`"
   */
  fence: number

  /**
   * The slide info of the current slide
   */
  slide: SlideInfo | null

  /**
   * Resolved Slidev options
   */
  options: ResolvedSlidevOptions
}

export type CodeblockTransformer = (ctx: CodeblockTransformContext) => Awaitable<string | undefined | null>

function defineSetup<Fn>(fn: Fn) {
  return fn
}

export const defineMarkdownTransformer = defineSetup<MarkdownTransformer>
export const defineCodeblockTransformer = defineSetup<CodeblockTransformer>
