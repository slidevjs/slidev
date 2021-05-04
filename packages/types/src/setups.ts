import type { Awaitable } from '@antfu/utils'
import type { IThemeRegistration, ILanguageRegistration, ShikiHighlighter } from 'shiki'
import type * as monaco from 'monaco-editor'
import type { App } from 'vue'
import type { Router } from 'vue-router'

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

export type ShikiSetup = () => Awaitable<ShikiOptions | undefined>
export type MonacoSetup = (m: typeof monaco) => Awaitable<void>
export type AppSetup = (context: AppContext) => Awaitable<void>

export function defineShikiSetup(fn: ShikiSetup) {
  return fn
}

export function defineMonacoSetup(fn: MonacoSetup) {
  return fn
}

export function defineAppSetup(fn: AppSetup) {
  return fn
}
