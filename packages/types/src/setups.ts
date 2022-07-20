/* eslint-disable import/no-duplicates */
import type { Awaitable } from '@antfu/utils'
import type { ILanguageRegistration, IThemeRegistration, Highlighter as ShikiHighlighter } from 'shiki'
import type * as Shiki from 'shiki'
import type * as monaco from 'monaco-editor'
import type { App, Ref } from 'vue'
import type { Router } from 'vue-router'
import type mermaid from 'mermaid'
import type { KatexOptions } from 'katex'
import type { WindiCssOptions } from 'vite-plugin-windicss'
import type { VitePluginConfig as UnoCssConfig } from 'unocss/vite'

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

export interface MonacoSetupReturn {
  theme?: {
    light?: string
    dark?: string
  }
}

export type MermaidOptions = (typeof mermaid.initialize) extends (a: infer A) => any ? A : never

export interface NavOperations {
  next: () => void
  prev: () => Promise<void>
  nextSlide: () => void
  prevSlide: () => Promise<void>
  go: (index: number) => void
  goFirst: () => void
  goLast: () => void
  downloadPDF: () => Promise<void>
  toggleDark: () => void
  toggleOverview: () => void
  toggleDrawing: () => void
  escapeOverview: () => void
  showGotoDialog: () => void
}

export interface ShortcutOptions {
  key: string | Ref<boolean>
  fn?: () => void
  autoRepeat?: boolean
  name?: string
}

// node side
export type ShikiSetup = (shiki: typeof Shiki) => Awaitable<ShikiOptions | undefined>
export type KatexSetup = () => Awaitable<Partial<KatexOptions> | undefined>
export type WindiSetup = () => Awaitable<Partial<WindiCssOptions> | undefined>
export type UnoSetup = () => Awaitable<Partial<UnoCssConfig> | undefined>

// client side
export type MonacoSetup = (m: typeof monaco) => Awaitable<MonacoSetupReturn>
export type AppSetup = (context: AppContext) => Awaitable<void>
export type MermaidSetup = () => Partial<MermaidOptions> | undefined
export type ShortcutsSetup = (nav: NavOperations, defaultShortcuts: ShortcutOptions[]) => Array<ShortcutOptions>

export function defineShikiSetup(fn: ShikiSetup) {
  return fn
}

export function defineWindiSetup(fn: WindiSetup) {
  return fn
}

export function defineUnoSetup(fn: UnoSetup) {
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

export function defineShortcutsSetup(fn: ShortcutsSetup) {
  return fn
}
