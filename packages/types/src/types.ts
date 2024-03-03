import type { ComputedRef } from '@vue/reactivity'
import type { SlidevConfig } from './config'

export type FrontmatterStyle = 'frontmatter' | 'yaml'

export interface SlideInfoBase {
  frontmatter: Record<string, any>
  content: string
  note?: string
  title?: string
  level?: number
}

export interface SourceSlideInfo extends SlideInfoBase {
  /**
   * The filepath of the markdown file
   */
  filepath: string
  /**
   * The index of the slide in the markdown file
   */
  index: number
  /**
   * The range of the slide in the markdown file
   */
  start: number
  end: number
  raw: string
  frontmatterRaw?: string
  frontmatterStyle?: FrontmatterStyle
}

export interface SlideInfo extends SlideInfoBase {
  /**
   * The index of the slide in the presentation
   */
  index: number
  source: SourceSlideInfo
  snippetsUsed?: LoadedSnippets
  noteHTML?: string
}

/**
 * Editable fields for a slide
 */
export type SlidePatch = Partial<Pick<SlideInfoBase, 'content' | 'note'>>

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
  filepath: string
  raw: string
  /**
   * All slides in this markdown file
   */
  slides: SourceSlideInfo[]
}

export interface SlidevData {
  /**
   * Slides that should be rendered (disabled slides excluded)
   */
  slides: SlideInfo[]
  entry: SlidevMarkdown
  config: SlidevConfig
  headmatter: Record<string, unknown>
  features: SlidevFeatureFlags
  themeMeta?: SlidevThemeMeta
  markdownFiles: Record<string, SlidevMarkdown>
  watchFiles: string[]
}

export interface SlidevPreparserExtension {
  name: string
  transformRawLines?: (lines: string[]) => Promise<void> | void
  transformSlide?: (content: string, frontmatter: any) => Promise<string | undefined>
}

export type PreparserExtensionLoader = (headmatter?: Record<string, unknown>, filepath?: string, mode?: string) => Promise<SlidevPreparserExtension[]>

export type RenderContext = 'none' | 'slide' | 'overview' | 'presenter' | 'previewNext'

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
  current: number
  readonly disabled: boolean
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
