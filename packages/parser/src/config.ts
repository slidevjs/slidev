import { ResolvedFontOptions, SlidevConfig, SlidevThemeMeta } from '@slidev/types'
import { parseAspectRatio } from './utils'
import { resolveFonts } from './core'

export function resolveConfig(headmatter: any, themeMeta: SlidevThemeMeta = {}) {
  const themeHightlighter = ['prism', 'shiki'].includes(themeMeta.highlighter || '') ? themeMeta.highlighter as 'prism' | 'shiki' : undefined
  const themeColorSchema = ['light', 'dark'].includes(themeMeta.colorSchema || '') ? themeMeta.colorSchema as 'light' | 'dark' : undefined

  const defaultConfig: SlidevConfig = {
    theme: 'default',
    title: 'Slidev',
    titleTemplate: '%s - Slidev',
    remoteAssets: true,
    monaco: 'dev',
    download: false,
    info: false,
    highlighter: themeHightlighter || 'prism',
    lineNumbers: false,
    colorSchema: themeColorSchema || 'auto',
    routerMode: 'history',
    aspectRatio: 16 / 9,
    canvasWidth: 980,
    selectable: false,
    themeConfig: {},
    fonts: {} as ResolvedFontOptions,
    persistDrawings: false,
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
  }

  if (config.colorSchema !== 'dark' && config.colorSchema !== 'light')
    config.colorSchema = 'auto'
  if (themeColorSchema && config.colorSchema === 'auto')
    config.colorSchema = themeColorSchema
  config.aspectRatio = parseAspectRatio(config.aspectRatio)

  if (themeColorSchema && config.colorSchema !== themeColorSchema)
    // eslint-disable-next-line no-console
    console.warn(`[slidev] Color schema "${config.colorSchema}" does not supported by the theme`)
  if (themeHightlighter && config.highlighter !== themeHightlighter)
    // eslint-disable-next-line no-console
    console.warn(`[slidev] Syntax highlighter "${config.highlighter}" does not supported by the theme`)

  return config
}
