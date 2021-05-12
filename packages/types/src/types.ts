export interface SlideInfo {
  index: number
  start: number
  end: number
  raw: string
  content: string
  note?: string
  frontmatter: Record<string, any>
  title?: string
}

export interface SlideInfoExtended extends SlideInfo {
  notesHTML: string
}

export interface SlidevConfig {
  title: string
  /**
   * @defult 'default'
   */
  theme: string
  /**
   * @defult true
   */
  remoteAssets: boolean | 'dev' | 'build'
  /**
   * @defult 'dev'
   */
  monaco: boolean | 'dev' | 'build'
  /**
   * Show a download button in the SPA build,
   * could also be a link to custom pdf
   *
   * @default true
   */
  download: boolean | string
  /**
   * Information shows on the built SPA
   * Can be a markdown string
   *
   * @default true
   */
  info: string | boolean
  /**
   * @default prism
   */
  highlighter: 'prism' | 'shiki'
  /**
   * @default 'auto'
   */
  colorSchema: 'dark' | 'light' | 'all' | 'auto'
}

export interface SlidevFeatureFlags {
  katex: boolean
  monaco: boolean
  tweet: boolean
  mermaid: boolean
}

export interface SlidevMarkdown {
  filepath?: string
  slides: SlideInfo[]
  raw: string
  config: SlidevConfig
  features: SlidevFeatureFlags
  headmatter: Record<string, unknown>
}
