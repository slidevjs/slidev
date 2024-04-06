import type { CodeToHastOptions } from 'shiki'
import type { Arrayable, Awaitable } from '@antfu/utils'

export interface CodeRunnerContext {
  /**
   * Options passed to runner via the `runnerOptions` prop.
   */
  options: Record<string, unknown>
  /**
   * Highlight code with shiki.
   */
  highlight: (code: string, lang: string, options?: Partial<CodeToHastOptions>) => Promise<string>
  /**
   * Resolve the import path of a module.
   */
  resolveId: (specifer: string) => Promise<string | null>
  /**
   * Use (other) code runner to run code.
   */
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

export interface CodeRunnerOutputDom {
  /**
   * The DOM element to be rendered.
   */
  element: HTMLElement
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

export type CodeRunnerOutput = CodeRunnerOutputHtml | CodeRunnerOutputError | CodeRunnerOutputText | CodeRunnerOutputTextArray | CodeRunnerOutputDom

export type CodeRunnerOutputs = Arrayable<CodeRunnerOutput>

export type CodeRunner = (code: string, ctx: CodeRunnerContext) => Awaitable<CodeRunnerOutputs>

export type CodeRunnerProviders = Record<string, CodeRunner>
