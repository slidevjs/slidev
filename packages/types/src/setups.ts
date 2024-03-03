import type { Awaitable } from '@antfu/utils'
import type * as monaco from 'monaco-editor'
import type { App, Ref } from 'vue'
import type { Router } from 'vue-router'
import type mermaid from 'mermaid'
import type { KatexOptions } from 'katex'
import type { CodeToHastOptions, Highlighter } from 'shiki'
import type { VitePluginConfig as UnoCssConfig } from 'unocss/vite'
import type { SlidevPreparserExtension } from './types'

export interface AppContext {
  app: App
  router: Router
}

export interface MonacoSetupReturn {
  editorOptions?: monaco.editor.IEditorOptions
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

export interface ShikiContext {
  /**
   * @deprecated Pass directly the theme name it's supported by Shiki.
   * For custom themes, load it manually via `JSON.parse(fs.readFileSync(path, 'utf-8'))` and pass the raw JSON object instead.
   */
  loadTheme: (path: string) => Promise<any>
}

export type ShikiSetupReturn = Partial<CodeToHastOptions> & {
  setup?: (highlighter: Highlighter) => Awaitable<void>
}

// node side
export type ShikiSetup = (shiki: ShikiContext) => Awaitable<ShikiSetupReturn | void>
export type KatexSetup = () => Awaitable<Partial<KatexOptions> | void>
export type UnoSetup = () => Awaitable<Partial<UnoCssConfig> | void>
export type PreparserSetup = (filepath: string) => SlidevPreparserExtension

// client side
export type MonacoSetup = (m: typeof monaco) => Awaitable<MonacoSetupReturn | void>
export type AppSetup = (context: AppContext) => Awaitable<void>
export type MermaidSetup = () => Partial<MermaidOptions> | void
export type ShortcutsSetup = (nav: NavOperations, defaultShortcuts: ShortcutOptions[]) => Array<ShortcutOptions>

export function defineShikiSetup(fn: ShikiSetup) {
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

export function definePreparserSetup(fn: PreparserSetup) {
  return fn
}
