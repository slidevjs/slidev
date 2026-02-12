import type { BuiltinLayouts } from './builtin-layouts'
import type { SlidevThemeConfig } from './types'

export interface Headmatter extends HeadmatterConfig, Omit<Frontmatter, 'title'> {
  /**
   * Default frontmatter options applied to all slides
   */
  defaults?: Frontmatter
}

export interface HeadmatterConfig extends TransitionOptions {
  /**
   * Title of the slides
   */
  title?: string
  /**
   * String template to compose title
   *
   * @example "%s - Slidev" - to suffix " - Slidev" to all pages
   * @default '%s - Slidev'
   */
  titleTemplate?: string
  /**
   * Theme to use for the slides
   *
   * See https://sli.dev/guide/theme-addon#use-theme
   * @default 'default'
   */
  theme?: string
  /**
   * List of Slidev addons
   *
   * @default []
   */
  addons?: string[]
  /**
   * Download remote assets in local using vite-plugin-remote-assets
   *
   * @default false
   */
  remoteAssets?: boolean | 'dev' | 'build'
  /**
   * Show a download button in the SPA build,
   * could also be a link to custom pdf
   *
   * @default false
   */
  download?: boolean | string
  /**
   * Show a copy button in code blocks
   *
   * @default true
   */
  codeCopy?: boolean
  /**
   * Show copy button in magic move code blocks
   *
   * `'final'` for only show copy button on the final step
   * `'always'` or `true` for show copy button on all steps
   *
   * @default true
   */
  magicMoveCopy?: boolean | 'final' | 'always'
  /**
   * The author of the slides
   */
  author?: string
  /**
   * Information shows on the built SPA
   * Can be a markdown string
   *
   * @default false
   */
  info?: string | boolean
  /**
   * Prefer highlighter
   *
   * See https://sli.dev/custom/config-highlighter.html
   * @default shiki
   */
  highlighter?: 'shiki'
  /**
   * Enable Twoslash
   *
   * @default true
   */
  twoslash?: boolean | 'dev' | 'build'
  /**
   * Show line numbers in code blocks
   *
   * @default false
   */
  lineNumbers?: boolean
  /**
   * Force slides color schema
   *
   * @default 'auto'
   */
  colorSchema?: 'dark' | 'light' | 'all' | 'auto'
  /**
   * Router mode for vue-router
   *
   * @default 'history'
   */
  routerMode?: 'hash' | 'history'
  /**
   * Aspect ratio for slides
   * should be like `16/9` or `1:1`
   *
   * @default '16/9'
   */
  aspectRatio?: number | string
  /**
   * The actual width for slides canvas.
   * unit in px.
   *
   * @default '980'
   */
  canvasWidth?: number
  /**
   * Controls whether texts in slides are selectable
   *
   * @default true
   */
  selectable?: boolean
  /**
   * Configure for themes, will inject intro root styles as
   * `--slidev-theme-x` for attribute `x`
   *
   * This allows themes to have customization options in frontmatter
   * Refer to themes' document for options avaliable
   *
   * @default {}
   */
  themeConfig?: SlidevThemeConfig
  /**
   * Configure fonts for the slides and app
   *
   * @default {}
   */
  fonts?: FontOptions
  /**
   * Configure the icon for app
   *
   * @default 'https://cdn.jsdelivr.net/gh/slidevjs/slidev/assets/favicon.png'
   */
  favicon?: string
  /**
   * Options for drawings
   *
   * @default {}
   */
  drawings?: DrawingsOptions
  /**
   * URL of PlantUML server used to render diagrams
   *
   * @default https://www.plantuml.com/plantuml
   */
  plantUmlServer?: string
  /**
   * Enable slides recording
   *
   * @default 'dev'
   */
  record?: boolean | 'dev' | 'build'
  /**
   * Expose the server to inbound requests (listen to `0.0.0.0`)
   *
   * Pass a string to set the password for accessing presenter mode.
   *
   * @default false
   */
  remote?: string | boolean
  /**
   * Engine for Atomic CSS
   *
   * See https://unocss.dev/
   * @deprecated
   * @default 'unocss'
   */
  css?: 'unocss'
  /**
   * Enable presenter mode
   *
   * @default true
   */
  presenter?: boolean | 'dev' | 'build'
  /**
   * Enable browser exporter
   *
   * @default 'dev'
   */
  browserExporter?: boolean | 'dev' | 'build'
  /**
   * Attributes to apply to the HTML element
   *
   * @default {}
   */
  htmlAttrs?: Record<string, string>
  /**
   * Suppport MDC syntax
   *
   * See https://github.com/antfu/markdown-it-mdc
   *
   * See https://content.nuxtjs.org/guide/writing/mdc
   *
   * @default false
   */
  mdc?: boolean
  /**
   * Enable built-in editor
   *
   * @default true
   */
  editor?: boolean
  /**
   * Enable context menu
   *
   * @default true
   */
  contextMenu?: boolean | 'dev' | 'build' | null
  /**
   * Enable wake lock
   */
  wakeLock?: boolean | 'dev' | 'build'
  /**
   * Force the filename used when exporting the presentation.
   * The extension, e.g. .pdf, gets automatically added.
   *
   * @default ''
   */
  exportFilename?: string | null
  /**
   * Enable Monaco
   *
   * See https://sli.dev/custom/config-monaco.html
   * @default true
   */
  monaco?: boolean | 'dev' | 'build'
  /**
   * Where to load monaco types from
   *
   * - `cdn` - load from CDN with `@typescript/ata`
   * - `local` - load from local node_modules
   *
   * @default 'local'
   */
  monacoTypesSource?: 'cdn' | 'local' | 'none'
  /**
   * Additional node packages to load as monaco types
   *
   * @default []
   */
  monacoTypesAdditionalPackages?: string[]
  /**
   * Packages to ignore when loading monaco types
   *
   * @default []
   */
  monacoTypesIgnorePackages?: string[]
  /**
   * Additional local modules to load as dependencies of monaco runnable
   *
   * @default []
   */
  monacoRunAdditionalDeps?: string[]
  /**
   * Whether to run monaco runnable code in strict mode
   *
   * @default true
   */
  monacoRunUseStrict?: boolean
  /**
   * Seo meta tags settings
   *
   * @default {}
   */
  seoMeta?: SeoMeta
  /**
   * Auto replace words with `<ruby>` tags in notes
   *
   * @default {}
   *
   * @example
   * ```yaml
   * notesAutoRuby:
   *   大丈夫: だいじょうぶ
   * ```
   */
  notesAutoRuby?: Record<string, string>
  /**
   * The expected duration of the slide
   *
   * @example
   * ```yaml
   * duration: 35min
   * ```
   *
   * @default '30min'
   */
  duration?: string | number
  /**
   * Timer mode
   *
   * @default 'stopwatch'
   */
  timer?: 'stopwatch' | 'countdown'
  /**
   * Duration for shiki magic move transitions in milliseconds
   *
   * @default 800
   */
  magicMoveDuration?: number
  /**
   * Preload images extracted from slides for faster navigation.
   *
   * - `true` - enable with default look-ahead of 3 slides
   * - `false` - disable image preloading
   * - `{ ahead: number }` - enable with custom look-ahead window
   *
   * @default true
   */
  preloadImages?: boolean | { ahead?: number }
}

export interface Frontmatter extends TransitionOptions {
  /**
   * Slide layout to use
   *
   * Default to 'cover' for the first slide, 'default' for the rest
   */
  layout?: BuiltinLayouts | string
  /**
   * Custom class added to the slide root element
   */
  class?: string | string[] | Record<string, unknown>
  /**
   * Manually specified the total clicks needed to this slide
   *
   * When not specified, the clicks will be calculated by the usage of v-clicks
   *
   * See https://sli.dev/guide/animations
   */
  clicks?: number
  /**
   * Manually specified the total clicks needed to this slide to start
   *
   * @default 0
   */
  clicksStart?: number
  /**
   * Preload the slide when the previous slide is active
   * @default true
   */
  preload?: boolean
  /**
   * Completely hide and disable the slide
   */
  hide?: boolean
  /**
   * Same as `hide`, completely hide and disable the slide
   */
  disabled?: boolean
  /**
   * Hide the slide for the `<Toc>` components
   *
   * See https://sli.dev/builtin/components#toc
   */
  hideInToc?: boolean
  /**
   * Override the title for the `<TitleRenderer>` and `<Toc>` components
   * Only if `title` has also been declared
   */
  title?: string
  /**
   * Override the title level for the `<TitleRenderer>` and `<Toc>` components
   * Only if `title` has also been declared
   */
  level?: number
  /**
   * Create a route alias that can be used in the URL or with the `<Link>` component
   */
  routeAlias?: string
  /**
   * Custom zoom level for the slide
   * @default 1
   */
  zoom?: number
  /**
   * Store the positions of draggable elements
   * Normally you don't need to set this manually
   *
   * See https://sli.dev/features/draggable
   */
  dragPos?: Record<string, string>
  /**
   * Includes a markdown file
   *
   * See https://sli.dev/guide/syntax.html#importing-slides
   */
  src?: string
  // /**
  //  * Set time split for the end of the slide
  //  *
  //  * Accepts:
  //  * - 10:05
  //  * - 10m5s
  //  * - +10s (relative to the previous point)
  //  */
  // timesplit?: string
  // /**
  //  * Set title for the time split
  //  *
  //  * Default to slide title
  //  */
  // timesplitTitle?: string
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
  provider?: 'none' | 'google' | 'coollabs'
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

export type BuiltinSlideTransition = 'fade' | 'fade-out' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'view-transition'

export interface TransitionOptions {
  /**
   * Page transition, powered by Vue's `<TransitionGroup/>`
   *
   * Built-in transitions:
   * - fade
   * - fade-out
   * - slide-left
   * - slide-right
   * - slide-up
   * - slide-down
   * - view-transition
   *
   * See https://sli.dev/guide/animations.html#pages-transitions
   *
   * See https://vuejs.org/guide/built-ins/transition.html
   */
  transition?: BuiltinSlideTransition | string | TransitionGroupProps | null
}

export interface TransitionGroupProps {
  appear?: boolean
  persisted?: boolean
  tag?: string
  moveClass?: string
  css?: boolean
  duration?: number | {
    enter: number
    leave: number
  }
  enterFromClass?: string
  enterActiveClass?: string
  enterToClass?: string
  appearFromClass?: string
  appearActiveClass?: string
  appearToClass?: string
  leaveFromClass?: string
  leaveActiveClass?: string
  leaveToClass?: string
}

/**
 * The following type should map to unhead MataFlat type
 */
export interface SeoMeta {
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogUrl?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  twitterSite?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  twitterUrl?: string
}
