/* eslint-disable no-use-before-define */

export interface SlideInfoBase {
  raw: string
  content: string
  note?: string
  frontmatter: Record<string, any>
  title?: string
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

export type FontOptions = {
  /**
   * Sans serif fonts (default fonts for most text)
   */
  sans?: string | string[]
  /**
   * Serif fonts
   */
  serif?: string | string[]
  /**
   * Monospace fonts, for code blocks and etc.
   */
  mono?: string | string[]
  /**
   * Load webfonts for custom CSS (does not apply anywhere by default)
   */
  custom?: string | string[]
  /**
   * Weights for fonts
   *
   * @default [200, 400, 600]
   */
  weights?: string | (string | number)[]
  /**
   * Import italic fonts
   *
   * @default false
   */
  italic?: boolean

  /**
   * @default 'google'
   */
  provider?: 'none' | 'google'
  /**
   * Specify web fonts names, will detect from `sans`, `mono`, `serif` if not provided
   */
  webfonts?: string[]
  /**
   * Specify local fonts names, be excluded from webfonts
   */
  local?: string[]
  /**
   * Use fonts fallback
   *
   * @default true
   */
  fallbacks?: boolean
}

export type ResolvedFontOptions = {
  sans: string[]
  mono: string[]
  serif: string[]
  weights: string[]
  italic: boolean
  provider: 'none' | 'google'
  webfonts: string[]
  local: string[]
}

export interface SlidevConfig {
  title: string
  /**
   * @see https://sli.dev/themes/use.html
   * @defult 'default'
   */
  theme: string
  /**
   * @defult true
   */
  remoteAssets: boolean | 'dev' | 'build'
  /**
   * Enable Monaco
   *
   * @see https://sli.dev/custom/config-monaco.html
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
   * Prefer highlighter
   *
   * @see https://sli.dev/custom/highlighters.html
   * @default prism
   */
  highlighter: 'prism' | 'shiki'
  /**
   * Force slides color schema
   *
   * @default 'auto'
   */
  colorSchema: 'dark' | 'light' | 'all' | 'auto'
  /**
   * Router mode for vue-router
   *
   * @default 'hash'
   */
  routerMode: 'hash' | 'history'
  /**
   * Aspect ratio for slides
   * should be like `16/9` or `1:1`
   *
   * @default '16/9'
   */
  aspectRatio: number
  /**
   * The actual width fro slides canvas.
   * unit in px.
   *
   * @default '980'
   */
  canvasWidth: number
  /**
   * Controls whether texts in slides are selectable
   *
   * @default false
   */
  selectable: boolean
  /**
   * Configure for themes, will inject intro root styles as
   * `--slidev-theme-x` for attribute `x`
   *
   * This allows themes to have customization options in frontmatter
   * Refer to themes' document for options avaliable
   *
   * @default {}
   */
  themeConfig: SlidevThemeConfig
  /**
   * Configure fonts for the slides and app
   *
   * @default {}
   */
  fonts: ResolvedFontOptions
}

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
