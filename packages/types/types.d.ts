export interface SlideInfo {
  start: number
  end: number
  raw: string
  content: string
  note?: string
  frontmatter: Record<string, any>
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
}

export interface SlidevMarkdown {
  filepath?: string
  slides: SlideInfo[]
  raw: string
  config: SlidevConfig
}
