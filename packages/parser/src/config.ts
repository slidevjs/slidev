import { toArray, uniq } from '@antfu/utils'
import type { DrawingsOptions, FontOptions, ResolvedDrawingsOptions, ResolvedFontOptions, SlidevConfig, SlidevThemeMeta } from '@slidev/types'
import { parseAspectRatio } from './utils'

export function resolveConfig(headmatter: any, themeMeta: SlidevThemeMeta = {}) {
  const themeHightlighter = ['prism', 'shiki'].includes(themeMeta.highlighter || '') ? themeMeta.highlighter as 'prism' | 'shiki' : undefined
  const themeColorSchema = ['light', 'dark'].includes(themeMeta.colorSchema || '') ? themeMeta.colorSchema as 'light' | 'dark' : undefined

  const defaultConfig: SlidevConfig = {
    theme: 'default',
    title: 'Slidev',
    titleTemplate: '%s - Slidev',
    addons: [],
    remoteAssets: false,
    monaco: 'dev',
    download: false,
    info: false,
    highlighter: themeHightlighter || 'prism',
    lineNumbers: false,
    colorSchema: themeColorSchema || 'auto',
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
    record: 'dev',
  }
  const config: SlidevConfig = {
    ...defaultConfig,
    ...themeMeta.defaults,
    ...headmatter.config,
    ...headmatter,
    fonts: resolveFonts({
      ...themeMeta.defaults?.fonts,
      ...headmatter.config?.fonts,
      ...headmatter?.fonts,
    }),
    drawings: resolveDrawings(headmatter.drawings),
  }

  if (config.colorSchema !== 'dark' && config.colorSchema !== 'light')
    config.colorSchema = 'auto'
  if (themeColorSchema && config.colorSchema === 'auto')
    config.colorSchema = themeColorSchema
  config.aspectRatio = parseAspectRatio(config.aspectRatio)

  if (themeColorSchema && config.colorSchema !== themeColorSchema)

    console.warn(`[slidev] Color schema "${config.colorSchema}" does not supported by the theme`)
  if (themeHightlighter && config.highlighter !== themeHightlighter)

    console.warn(`[slidev] Syntax highlighter "${config.highlighter}" does not supported by the theme`)

  return config
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

function resolveDrawings(options: DrawingsOptions = {}): ResolvedDrawingsOptions {
  const {
    enabled = true,
    persist = false,
    presenterOnly = false,
    syncAll = true,
  } = options

  const persistPath = typeof persist === 'string'
    ? persist
    : persist
      ? '.slidev/drawings'
      : false

  return {
    enabled,
    persist: persistPath,
    presenterOnly,
    syncAll,
  }
}
