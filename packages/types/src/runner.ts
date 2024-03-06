import type { CodeToHastOptions } from 'shiki'

export interface CodeRunnerContext {
  options: Record<string, unknown>
  highlight: (code: string, lang: string, options?: Partial<CodeToHastOptions>) => Promise<string>
  run: (code: string, lang: string) => Promise<CodeRunnerOutput>
}

export type CodeRunnerTextOutput =
  (
    | {
      text: string
      class?: string
      highlightLang?: string
    }
    | {
      html: string
    }
  )[]

export type CodeRunnerOutput =
  | CodeRunnerTextOutput[]
  | {
    html: string
  }
  | {
    error: string
  }

export type CodeRunner = (code: string, ctx: CodeRunnerContext) => Promise<CodeRunnerOutput>
