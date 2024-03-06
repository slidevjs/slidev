import type { CodeToHastOptions } from 'shiki'

export interface RunnerContext {
  options: Record<string, unknown>
  highlight: (code: string, lang: string, options?: Partial<CodeToHastOptions>) => Promise<string>
  run: (code: string, lang: string) => Promise<RunnerOutput>
}

export type RunnerTextOutput =
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

export type RunnerOutput =
  | RunnerTextOutput[]
  | {
    html: string
  }
  | {
    error: string
  }

export type CodeRunner = (code: string, ctx: RunnerContext) => Promise<RunnerOutput>
