import type { CodeToHastOptions } from 'shiki'
import type { Arrayable, Awaitable } from '@antfu/utils'

export interface CodeRunnerContext {
  options: Record<string, unknown>
  highlight: (code: string, lang: string, options?: Partial<CodeToHastOptions>) => Promise<string>
  run: (code: string, lang: string) => Promise<CodeRunnerOutputs>
}

export interface CodeRunnerOutputHtml {
  /**
   * The HTML to be rendered.
   *
   * Slidev does NOT sanitize the HTML for you - make sure it's from trusted sources or sanitize it before passing it in
   */
  html: string
}

export interface CodeRunnerOutputError {
  /**
   * The error message to be displayed.
   */
  error: string
}

export interface CodeRunnerOutputText {
  /**
   * The text to be displayed.
   */
  text: string
  /**
   * The class to be applied to the text.
   */
  class?: string
  /**
   * The language to be highlighted.
   */
  highlightLang?: string
}

export type CodeRunnerOutputTextArray = CodeRunnerOutputText[]

export type CodeRunnerOutput = CodeRunnerOutputHtml | CodeRunnerOutputError | CodeRunnerOutputText | CodeRunnerOutputTextArray

export type CodeRunnerOutputs = Arrayable<CodeRunnerOutput>

export type CodeRunner = (code: string, ctx: CodeRunnerContext) => Awaitable<CodeRunnerOutputs>

export type CodeRunnerProviders = Record<string, CodeRunner>
