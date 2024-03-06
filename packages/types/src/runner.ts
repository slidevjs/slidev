import type { CodeToHastOptions } from 'shiki'

export interface RunnerContext {
  highlight: (code: string, lang: string, options?: Partial<CodeToHastOptions>) => Promise<string>
  run: (code: string, lang: string) => Promise<RunnerOutput>
  rawMode: boolean
}

export interface RunnerTextOutput {
  type?: string
  content: (
    | {
      text: string
      class?: string
      highlightLang?: string
    }
    | {
      html: string
    }
  )[]
}

export type RunnerOutput =
  | RunnerTextOutput[]
  | {
    html: string
  }
  | {
    error: string
  }

export type CodeRunner = (code: string, ctx: RunnerContext) => Promise<RunnerOutput>
