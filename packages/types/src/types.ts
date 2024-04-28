import type { RouteComponent, RouteMeta } from 'vue-router'
import type YAML from 'yaml'
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
  frontmatterDoc?: YAML.Document
  frontmatterStyle?: FrontmatterStyle
}

export interface SlideInfo extends SlideInfoBase {
  /**
   * The index of the slide in the presentation
   */
  index: number
  /**
   * The importers of this slide. `[]` if this slide is the entry markdown file
   */
  importChain?: SourceSlideInfo[]
  /**
   * The source slide where the content is from
   */
  source: SourceSlideInfo
  snippetsUsed?: LoadedSnippets
  noteHTML?: string
}

/**
 * Editable fields for a slide
 */
export type SlidePatch = Partial<Pick<SlideInfoBase, 'content' | 'note'>> & {
  skipHmr?: boolean
  /**
   * The frontmatter patch (only the changed fields)
   * `null` to remove a field
   */
  frontmatter?: Record<string, any>
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

export interface SlidevDetectedFeatures {
  katex: boolean
  /**
   * `false` or referenced module specifiers
   */
  monaco: false | {
    types: string[]
    deps: string[]
  }
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
  features: SlidevDetectedFeatures
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

export interface SlideRoute {
  no: number
  meta: RouteMeta
  component: () => Promise<RouteComponent>
}

export type LoadedSnippets = Record<string, string>
