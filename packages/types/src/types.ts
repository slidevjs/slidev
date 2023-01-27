import type { SlidevConfig } from './config'

export interface SlideInfoBase {
  raw: string
  content: string
  note?: string
  frontmatter: Record<string, any>
  title?: string
  level?: number
}

export interface SlideInfo extends SlideInfoBase {
  index: number
  start: number
  end: number
  inline?: SlideInfoBase
  source?: SlideInfoWithPath
}

export interface SlideInfoWithPath extends SlideInfoBase {
  filepath: string
}

export interface SlideInfoExtended extends SlideInfo {
  notesHTML: string
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
  transformRawLines?(lines: string[]): Promise<void> | void
  transformSlide?(content: string, frontmatter: any): Promise<string | undefined>
}

export type PreparserExtensionLoader = (headmatter?: Record<string, unknown>, filepath?: string) => Promise<SlidevPreparserExtension[]>

// internal type?
export type PreparserExtensionFromHeadmatter = (headmatter: any, exts: SlidevPreparserExtension[], filepath?: string) => Promise<SlidevPreparserExtension[]>

export type RenderContext = 'slide' | 'overview' | 'presenter' | 'previewNext'
