import type { ComputedRef } from '@vue/reactivity'
import type { SlidevConfig } from './config'

export type FrontmatterStyle = 'frontmatter' | 'yaml'

export interface SlideInfoBase {
  raw: string
  content: string
  note?: string
  frontmatter: Record<string, any>
  frontmatterRaw?: string
  frontmatterStyle?: FrontmatterStyle
  title?: string
  level?: number
}

export interface SlideInfo extends SlideInfoBase {
  index: number
  start: number
  end: number
  inline?: SlideInfoBase
  source?: SlideInfoWithPath
  snippetsUsed?: LoadedSnippets
}

export interface SlideInfoWithPath extends SlideInfoBase {
  filepath: string
}

export interface SlideInfoExtended extends SlideInfo {
  noteHTML: string
}

/**
 * Metadata for "slidev" field in themes' package.json
 */
export interface SlidevThemeMeta {
  defaults?: Partial<SlidevConfig>
  colorSchema?: 'dark' | 'light' | 'both'
  highlighter?: 'prism' | 'shiki' | 'both'
}

export type SlidevThemeConfig = Record<string, string | number>

export interface SlidevFeatureFlags {
  katex: boolean
  monaco: boolean
  tweet: boolean
  mermaid: boolean
}

export interface SlidevMarkdown {
  slides: SlideInfo[]
  raw: string
  config: SlidevConfig
  features: SlidevFeatureFlags
  headmatter: Record<string, unknown>

  filepath?: string
  entries?: string[]
  themeMeta?: SlidevThemeMeta
}

export interface SlidevPreparserExtension {
  name: string
  transformRawLines?: (lines: string[]) => Promise<void> | void
  transformSlide?: (content: string, frontmatter: any) => Promise<string | undefined>
}

export type PreparserExtensionLoader = (headmatter?: Record<string, unknown>, filepath?: string) => Promise<SlidevPreparserExtension[]>

// internal type?
export type PreparserExtensionFromHeadmatter = (headmatter: any, exts: SlidevPreparserExtension[], filepath?: string) => Promise<SlidevPreparserExtension[]>

export type RenderContext = 'slide' | 'overview' | 'presenter' | 'previewNext'

export type LoadedSnippets = Record<string, string>

export type ClicksElement = Element | string

export type ClicksRelativeEls = Map<ClicksElement, number>

export interface ResolvedClicksInfo {
  max: number
  relativeDelta: number
  isCurrent?: ComputedRef<boolean>
  isActive?: ComputedRef<boolean>
  isShown?: ComputedRef<boolean>
}

export type ClicksMap = Map<ClicksElement, ResolvedClicksInfo>

export interface ClicksContext {
  readonly disabled: boolean
  readonly current: number
  readonly relativeOffsets: ClicksRelativeEls
  readonly map: ClicksMap
  register: (el: ClicksElement, resolved: ResolvedClicksInfo) => void
  unregister: (el: ClicksElement) => void
  readonly currentOffset: number
  readonly total: number
}
