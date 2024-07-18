import type { Awaitable, Nullable } from '@antfu/utils'
import type * as monaco from 'monaco-editor'
import type { App, ComputedRef, Ref } from 'vue'
import type { RouteRecordRaw, Router } from 'vue-router'
import type { KatexOptions } from 'katex'
import type { BuiltinLanguage, BuiltinTheme, CodeOptionsMeta, CodeOptionsThemes, CodeToHastOptionsCommon, Highlighter, LanguageInput } from 'shiki'
import type { VitePluginConfig as UnoCssConfig } from 'unocss/vite'
import type { MermaidConfig } from 'mermaid'
import type { MarkdownItShikiOptions } from '@shikijs/markdown-it'
import type { SlidevPreparserExtension } from './types'
import type { CodeRunnerProviders } from './code-runner'
import type { ContextMenuItem } from './context-menu'

export interface AppContext {
  app: App
  router: Router
}

export interface MonacoSetupReturn {
  editorOptions?: monaco.editor.IEditorOptions
}

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

export type ShikiSetupReturn =
  Partial<
    & Omit<CodeToHastOptionsCommon<BuiltinLanguage>, 'lang'>
    & CodeOptionsThemes<BuiltinTheme>
    & CodeOptionsMeta
    & {
      setup: (highlighter: Highlighter) => Awaitable<void>
      langs: (LanguageInput | BuiltinLanguage)[]
    }
  >

// node side
export type ShikiSetup = (shiki: ShikiContext) => Awaitable<ShikiSetupReturn | void>
export type KatexSetup = () => Awaitable<Partial<KatexOptions> | void>
export type UnoSetup = () => Awaitable<Partial<UnoCssConfig> | void>
export type PreparserSetup = (context: {
  filepath: string
  headmatter: Record<string, unknown>
  mode?: string
}) => Awaitable<SlidevPreparserExtension[]>

/**
 *
 */
export interface NodeSideSetupResult {
  katex: Promise<KatexOptions>
  shiki: Promise<MarkdownItShikiOptions>
  preparser: Promise<SlidevPreparserExtension[]>
  /**
   * Reload all setups
   */
  reload: () => void
}

// client side
export type MonacoSetup = (m: typeof monaco) => Awaitable<MonacoSetupReturn | void>
export type AppSetup = (context: AppContext) => Awaitable<void>
export type RootSetup = () => Awaitable<void>
export type RoutesSetup = (routes: RouteRecordRaw[]) => RouteRecordRaw[]
export type MermaidSetup = () => Awaitable<Partial<MermaidConfig> | void>
export type ShortcutsSetup = (nav: NavOperations, defaultShortcuts: ShortcutOptions[]) => Array<ShortcutOptions>
export type CodeRunnersSetup = (runners: CodeRunnerProviders) => Awaitable<CodeRunnerProviders | void>
export type ContextMenuSetup = (items: ComputedRef<ContextMenuItem[]>) => ComputedRef<ContextMenuItem[]>

function defineSetup<Fn>(fn: Fn) {
  return fn
}

export const defineShikiSetup = defineSetup<ShikiSetup>
export const defineUnoSetup = defineSetup<UnoSetup>
export const defineMonacoSetup = defineSetup<MonacoSetup>
export const defineAppSetup = defineSetup<AppSetup>
export const defineRootSetup = defineSetup<RootSetup>
export const defineRoutesSetup = defineSetup<RoutesSetup>
export const defineMermaidSetup = defineSetup<MermaidSetup>
export const defineKatexSetup = defineSetup<KatexSetup>
export const defineShortcutsSetup = defineSetup<ShortcutsSetup>
export const definePreparserSetup = defineSetup<PreparserSetup>
export const defineCodeRunnersSetup = defineSetup<CodeRunnersSetup>
export const defineContextMenuSetup = defineSetup<ContextMenuSetup>
