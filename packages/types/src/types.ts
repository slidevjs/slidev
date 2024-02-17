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

export interface SlideInfoWithPath extends SlideInfo {
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
  subSlides?: Record<string, SlidevMarkdownWithPath>
}

export interface SlidevMarkdownWithPath extends SlidevMarkdown {
  filepath: string
  slides: SlideInfoWithPath[]
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

export interface ClicksInfo {
  /**
   * The maximum clicks, used to calculate the total clicks for current slide
   */
  max?: number
  /**
   * The offsets added to the subsequent clicks
   * Delta is 0 when the click is absolute
   */
  delta: number
  /**
   * Resolved clicks
   */
  clicks?: number | [number, number]
  /**
   * Computed ref of whether the click is exactly matched
   */
  isCurrent?: ComputedRef<boolean>
  /**
   * Computed ref of whether the click is active
   */
  isActive?: ComputedRef<boolean>
  /**
   * Computed ref of whether the click is shown, it take flagHide into account
   */
  isShown?: ComputedRef<boolean>
  /**
   * Having the hide flag
   */
  flagHide?: boolean
  /**
   * Having the fade flag
   */
  flagFade?: boolean
}

export type ResolvedClicksInfo = Required<ClicksInfo>

export type ClicksMap = Map<ClicksElement, ClicksInfo>

export interface ClicksContext {
  readonly disabled: boolean
  readonly current: number
  readonly relativeOffsets: ClicksRelativeEls
  readonly map: ClicksMap
  resolve: (at: string | number, size?: number) => {
    start: number
    end: number
    delta: number
  }
  register: (el: ClicksElement, info: ClicksInfo) => void
  unregister: (el: ClicksElement) => void
  readonly currentOffset: number
  readonly total: number
}
