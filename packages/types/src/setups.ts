import type { Awaitable } from '@antfu/utils'
import type { IThemeRegistration, ILanguageRegistration, Highlighter as ShikiHighlighter } from 'shiki'
import type * as monaco from 'monaco-editor'
import type { App } from 'vue'
import type { Router } from 'vue-router'
import type mermaid from 'mermaid'
import type { KatexOptions } from 'katex'

export interface AppContext {
  app: App
  router: Router
}

export interface ShikiDarkModeThemes {
  dark: IThemeRegistration
  light: IThemeRegistration
}

export interface ShikiOptions {
  theme?: IThemeRegistration | ShikiDarkModeThemes
  langs?: ILanguageRegistration[]
  highlighter?: ShikiHighlighter
}

export type MermaidOptions = (typeof mermaid.initialize) extends (a: infer A) => any ? A : never

// node side
export type ShikiSetup = () => Awaitable<ShikiOptions | undefined>
export type KatexSetup = () => Awaitable<Partial<KatexOptions> | undefined>

// client side
export type MonacoSetup = (m: typeof monaco) => Awaitable<void>
export type AppSetup = (context: AppContext) => Awaitable<void>
export type MermaidSetup = () => Partial<MermaidOptions> | undefined

export function defineShikiSetup(fn: ShikiSetup) {
  return fn
}

export function defineMonacoSetup(fn: MonacoSetup) {
  return fn
}

export function defineAppSetup(fn: AppSetup) {
  return fn
}

export function defineMermaidSetup(fn: MermaidSetup) {
  return fn
}

export function defineKatexSetup(fn: KatexSetup) {
  return fn
}
