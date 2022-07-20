import type { SlidevThemeConfig } from './types'

export interface SlidevConfig {
  title: string
  /**
   * String template to compose title
   *
   * @example "%s - Slidev" - to suffix " - Slidev" to all pages
   * @default '%s - Slidev'
   */
  titleTemplate: string
  /**
   * Theme to use for the slides
   *
   * @see https://sli.dev/themes/use.html
   * @default 'default'
   */
  theme: string
  /**
   * List of Slidev addons
   *
   * @default []
   */
  addons: string[]
  /**
   * Download remote assets in local using vite-plugin-remote-assets
   *
   * @default false
   */
  remoteAssets: boolean | 'dev' | 'build'
  /**
   * Enable Monaco
   *
   * @see https://sli.dev/custom/config-monaco.html
   * @default 'dev'
   */
  monaco: boolean | 'dev' | 'build'
  /**
   * Show a download button in the SPA build,
   * could also be a link to custom pdf
   *
   * @default false
   */
  download: boolean | string
  /**
   * Show a copy button in code blocks
   *
   * @default true
   */
  codeCopy: boolean
  /**
   * Information shows on the built SPA
   * Can be a markdown string
   *
   * @default false
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
   * Show line numbers in code blocks
   *
   * @default false
   */
  lineNumbers: boolean
  /**
   * Force slides color schema
   *
   * @default 'auto'
   */
  colorSchema: 'dark' | 'light' | 'all' | 'auto'
  /**
   * Router mode for vue-router
   *
   * @default 'history'
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
   * The actual width for slides canvas.
   * unit in px.
   *
   * @default '980'
   */
  canvasWidth: number
  /**
   * Force the filename used when exporting the presentation.
   * The extension, e.g. .pdf, gets automatically added.
   *
   * @default ''
   */
  exportFilename: string | null
  /**
   * Controls whether texts in slides are selectable
   *
   * @default true
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
  /**
   * Configure the icon for app
   *
   * @default 'https://cdn.jsdelivr.net/gh/slidevjs/slidev/assets/favicon.png'
   */
  favicon: string
  /**
   * Options for drawings
   *
   * @default {}
   */
  drawings: ResolvedDrawingsOptions
  /**
   * URL of PlantUML server used to render diagrams
   *
   * @default https://www.plantuml.com/plantuml
   */
  plantUmlServer: string
  /**
   * Enable slides recording
   *
   * @default 'dev'
   */
  record: boolean | 'dev' | 'build'
  /**
   * Expose the server to inbound requests (listen to `0.0.0.0`)
   *
   * Pass a string to set the password for accessing presenter mode.
   *
   * @default false
   */
  remote?: string | boolean
  /**
   * Engine for atomic CSS
   *
   * UnoCSS support is currently experimental.
   *
   * @default 'windicss'
   */
  css: 'windicss' | 'unocss'
}

export interface FontOptions {
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

export interface DrawingsOptions {
  /**
   * Persist the drawings to disk
   * Passing string to specify the directory (default to `.slidev/drawings`)
   *
   * @default false
   */
  persist?: boolean | string

  /**
   * @default true
   */
  enabled?: boolean | 'dev' | 'build'

  /**
   * Only allow drawing from presenter mode
   *
   * @default false
   */
  presenterOnly?: boolean

  /**
   * Sync drawing for all instances
   *
   * @default true
   */
  syncAll?: boolean
}

export interface ResolvedFontOptions {
  sans: string[]
  mono: string[]
  serif: string[]
  weights: string[]
  italic: boolean
  provider: 'none' | 'google'
  webfonts: string[]
  local: string[]
}

export interface ResolvedDrawingsOptions {
  persist: string | false
  enabled: boolean | 'dev' | 'build'
  presenterOnly: boolean
  syncAll: boolean
}
