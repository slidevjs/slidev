import type { DrawingsOptions, FontOptions, HandoutOptions, ResolvedDrawingsOptions, ResolvedExportOptions, ResolvedFontOptions, ResolvedHandoutOptions, SlidevConfig, SlidevThemeMeta } from '@slidev/types'
import { toArray, uniq } from '@antfu/utils'
import { parseAspectRatio } from './utils'

export function getDefaultConfig(): SlidevConfig {
  return {
    theme: 'default',
    title: 'Slidev',
    titleTemplate: '%s - Slidev',
    addons: [],
    remoteAssets: false,
    monaco: true,
    monacoTypesSource: 'local',
    monacoTypesAdditionalPackages: [],
    monacoTypesIgnorePackages: [],
    monacoRunAdditionalDeps: [],
    download: false,
    export: {} as ResolvedExportOptions,
    info: false,
    highlighter: 'shiki',
    twoslash: true,
    lineNumbers: false,
    colorSchema: 'auto',
    routerMode: 'history',
    aspectRatio: 16 / 9,
    canvasWidth: 980,
    exportFilename: '',
    selectable: false,
    themeConfig: {},
    fonts: {} as ResolvedFontOptions,
    favicon: 'https://cdn.jsdelivr.net/gh/slidevjs/slidev/assets/favicon.png',
    drawings: {} as ResolvedDrawingsOptions,
    plantUmlServer: 'https://www.plantuml.com/plantuml',
    codeCopy: true,
    magicMoveCopy: true,
    author: '',
    record: 'dev',
    css: 'unocss',
    presenter: true,
    browserExporter: 'dev',
    htmlAttrs: {},
    transition: null,
    editor: true,
    contextMenu: null,
    wakeLock: true,
    remote: false,
    mdc: false,
    seoMeta: {},
    handout: resolveHandoutOptions(),
  }
}

export function resolveConfig(headmatter: any, themeMeta: SlidevThemeMeta = {}, filepath?: string, verify = false) {
  const themeHightlighter = ['prism', 'shiki', 'shikiji'].includes(themeMeta.highlighter || '')
    ? themeMeta.highlighter as 'shiki'
    : undefined
  const themeColorSchema = ['light', 'dark'].includes(themeMeta.colorSchema || '')
    ? themeMeta.colorSchema as 'light' | 'dark'
    : undefined

  const defaultConfig = getDefaultConfig()

  const config: SlidevConfig = {
    ...defaultConfig,
    highlighter: themeHightlighter || defaultConfig.highlighter,
    colorSchema: themeColorSchema || defaultConfig.colorSchema,
    ...themeMeta.defaults,
    ...headmatter.config,
    ...headmatter,
    fonts: resolveFonts({
      ...themeMeta.defaults?.fonts,
      ...headmatter.config?.fonts,
      ...headmatter?.fonts,
    }),
    drawings: resolveDrawings(headmatter.drawings, filepath),
    htmlAttrs: {
      ...themeMeta.defaults?.htmlAttrs,
      ...headmatter.config?.htmlAttrs,
      ...headmatter?.htmlAttrs,
    },
  }

  config.handout = resolveHandoutOptions(config.handout)

  // @ts-expect-error compat
  if (config.highlighter === 'shikiji') {
    console.warn(`[slidev] "shikiji" is merged back to "shiki", you can safely change it "highlighter: shiki"`)
    config.highlighter = 'shiki'
  }

  // @ts-expect-error compat
  if (config.highlighter === 'prism')
    throw new Error(`[slidev] "prism" support has been dropped. Please use "highlighter: shiki" instead`)

  if (config.colorSchema !== 'dark' && config.colorSchema !== 'light')
    config.colorSchema = 'auto'
  if (themeColorSchema && config.colorSchema === 'auto')
    config.colorSchema = themeColorSchema

  config.aspectRatio = parseAspectRatio(config.aspectRatio)

  if (verify)
    verifyConfig(config, themeMeta)

  return config
}

export function verifyConfig(
  config: SlidevConfig,
  themeMeta: SlidevThemeMeta = {},
  warn = (v: string) => console.warn(`[slidev] ${v}`),
) {
  const themeHightlighter = themeMeta.highlighter === 'shiki'
    ? themeMeta.highlighter as 'shiki'
    : undefined
  const themeColorSchema = ['light', 'dark'].includes(themeMeta.colorSchema || '')
    ? themeMeta.colorSchema as 'light' | 'dark'
    : undefined

  if (themeColorSchema && config.colorSchema !== themeColorSchema)
    warn(`Color schema "${config.colorSchema}" does not supported by the theme`)

  if (themeHightlighter && config.highlighter !== themeHightlighter)
    warn(`Syntax highlighter "${config.highlighter}" does not supported by the theme`)

  if (config.css !== 'unocss') {
    warn(`Unsupported Atomic CSS engine "${config.css}", fallback to UnoCSS`)
    config.css = 'unocss'
  }
}

export function resolveFonts(fonts: FontOptions = {}): ResolvedFontOptions {
  const {
    fallbacks = true,
    italic = false,
    provider = 'google',
  } = fonts
  let sans = toArray(fonts.sans).flatMap(i => i.split(/,\s*/g)).map(i => i.trim())
  let serif = toArray(fonts.serif).flatMap(i => i.split(/,\s*/g)).map(i => i.trim())
  let mono = toArray(fonts.mono).flatMap(i => i.split(/,\s*/g)).map(i => i.trim())
  const weights = toArray(fonts.weights || '200,400,600').flatMap(i => i.toString().split(/,\s*/g)).map(i => i.trim())
  const custom = toArray(fonts.custom).flatMap(i => i.split(/,\s*/g)).map(i => i.trim())

  const local = toArray(fonts.local).flatMap(i => i.split(/,\s*/g)).map(i => i.trim())
  const webfonts = fonts.webfonts
    ? fonts.webfonts
    : fallbacks
      ? uniq([...sans, ...serif, ...mono, ...custom])
      : []

  webfonts.filter(i => local.includes(i))

  function toQuoted(font: string) {
    if (/^(['"]).*\1$/.test(font))
      return font
    return `"${font}"`
  }

  if (fallbacks) {
    sans = uniq([
      ...sans.map(toQuoted),
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      '"Noto Sans"',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
      '"Noto Color Emoji"',
    ])
    serif = uniq([
      ...serif.map(toQuoted),
      'ui-serif',
      'Georgia',
      'Cambria',
      '"Times New Roman"',
      'Times',
      'serif',
    ])
    mono = uniq([
      ...mono.map(toQuoted),
      'ui-monospace',
      'SFMono-Regular',
      'Menlo',
      'Monaco',
      'Consolas',
      '"Liberation Mono"',
      '"Courier New"',
      'monospace',
    ])
  }

  return {
    sans,
    serif,
    mono,
    webfonts,
    provider,
    local,
    italic,
    weights,
  }
}

const PAPER_SIZES_MM: Record<string, { label: string, mm: [number, number] }> = {
  a5: { label: 'A5', mm: [148, 210] },
  a4: { label: 'A4', mm: [210, 297] },
  a3: { label: 'A3', mm: [297, 420] },
  letter: { label: 'letter', mm: [215.9, 279.4] },
  legal: { label: 'legal', mm: [215.9, 355.6] },
  tabloid: { label: 'tabloid', mm: [279.4, 431.8] },
  executive: { label: 'executive', mm: [184.15, 266.7] },
}

const PX_PER_MM = 96 / 25.4
const DEFAULT_HANDOUT_MARGINS = { top: '0cm', right: '0cm', bottom: '0cm', left: '0cm' } as const
const DEFAULT_HANDOUT_COVER_MARGINS = { top: '1cm', right: '1.5cm', bottom: '1cm', left: '1.5cm' } as const

function formatMm(value: number): string {
  return `${Number(value.toFixed(3))}mm`
}

function normalizeMargins(
  input: string | Partial<Record<'top' | 'right' | 'bottom' | 'left', string>> | undefined,
  fallback: ResolvedHandoutOptions['margins'],
): ResolvedHandoutOptions['margins'] {
  if (!input)
    return { ...fallback }
  if (typeof input === 'string') {
    return {
      top: input,
      right: input,
      bottom: input,
      left: input,
    }
  }
  return {
    top: input.top ?? fallback.top,
    right: input.right ?? fallback.right,
    bottom: input.bottom ?? fallback.bottom,
    left: input.left ?? fallback.left,
  }
}

export function resolveHandoutOptions(
  options: HandoutOptions | ResolvedHandoutOptions | undefined = undefined,
): ResolvedHandoutOptions {
  if (options && typeof options === 'object' && 'widthMm' in options && 'heightMm' in options && 'cssPageSize' in options) {
    return {
      ...options,
      margins: { ...options.margins },
      coverMargins: { ...options.coverMargins },
    }
  }

  const normalized = typeof options === 'string' ? { size: options } : options || {}
  const requestedKey = normalized.size ? normalized.size.toLowerCase() : 'a4'
  const preset = PAPER_SIZES_MM[requestedKey] || PAPER_SIZES_MM.a4

  let widthMm = normalized.width && normalized.height
    ? normalized.unit === 'in'
      ? normalized.width * 25.4
      : normalized.width
    : preset.mm[0]
  let heightMm = normalized.width && normalized.height
    ? normalized.unit === 'in'
      ? normalized.height * 25.4
      : normalized.height
    : preset.mm[1]

  const orientation = normalized.orientation
    ?? (widthMm >= heightMm ? 'landscape' : 'portrait')

  if (orientation === 'landscape' && heightMm > widthMm)
    [widthMm, heightMm] = [heightMm, widthMm]
  else if (orientation === 'portrait' && widthMm > heightMm)
    [widthMm, heightMm] = [heightMm, widthMm]

  const widthPx = Math.round(widthMm * PX_PER_MM)
  const heightPx = Math.round(heightMm * PX_PER_MM)

  const cssKeyword = preset.label
  const cssPageSize = normalized.width && normalized.height
    ? `${formatMm(widthMm)} ${formatMm(heightMm)}`
    : orientation === 'landscape'
      ? `${cssKeyword} landscape`
      : cssKeyword

  return {
    size: normalized.width && normalized.height ? 'custom' : cssKeyword,
    orientation,
    widthMm,
    heightMm,
    widthPx,
    heightPx,
    cssPageSize,
    margins: normalizeMargins(normalized.margins, DEFAULT_HANDOUT_MARGINS),
    coverMargins: normalizeMargins(normalized.coverMargins, DEFAULT_HANDOUT_COVER_MARGINS),
  }
}

function resolveDrawings(options: DrawingsOptions = {}, filepath?: string): ResolvedDrawingsOptions {
  const {
    enabled = true,
    persist = false,
    presenterOnly = false,
    syncAll = true,
  } = options

  const persistPath = typeof persist === 'string'
    ? persist
    : persist
      ? `.slidev/drawings${filepath ? `/${filepath.match(/([^\\/]+?)(\.\w+)?$/)?.[1]}` : ''}`
      : false

  return {
    enabled,
    persist: persistPath,
    presenterOnly,
    syncAll,
  }
}
