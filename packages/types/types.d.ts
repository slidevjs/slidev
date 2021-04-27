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

export interface ParseOptions {
  /**
   * Transform Monaco block
   *
   * @default true
   */
  enabledMonaco?: boolean
}

export interface SlidevConfig {
  title: string
  theme: string
  remoteAssets: boolean
  monaco: boolean | 'dev-only'
}

export interface SlidevMarkdown {
  filepath?: string
  slides: SlideInfo[]
  options: ParseOptions
  raw: string
  config: SlidevConfig
}
