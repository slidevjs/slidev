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
  monaco: boolean | 'dev'
  /**
   * Show a download button in the SPA build,
   * could also be a link to custom pdf
   *
   * @default true
   */
  download: boolean | string
  /**
   * @default true
   */
  info: boolean
  /**
   * @default prism
   */
  highlighter: 'prism' | 'shiki'
}

export interface SlidevMarkdown {
  filepath?: string
  slides: SlideInfo[]
  raw: string
  config: SlidevConfig
}
