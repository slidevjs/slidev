import { resolve, dirname } from 'path'
import Vue from '@vitejs/plugin-vue'
import ViteIcons from 'vite-plugin-icons'
import ViteComponents from 'vite-plugin-components'
import Markdown from 'vite-plugin-md'
import WindiCSS from 'vite-plugin-windicss'
import RemoteAssets from 'vite-plugin-remote-assets'
import { ArgumentsType } from '@antfu/utils'
import * as parser from '../parser'
import { SlidevMarkdown } from '../parser'

export interface SlidevEntryOptions {
  /**
   * Markdown entry
   *
   * @default 'slides.md'
   */
  entry?: string

  /**
   * Theme id
   */
  theme?: string

  /**
   * Root path
   *
   * @default process.cwd()
   */
  userRoot?: string
}

export interface ResolvedSlidevOptions {
  data: SlidevMarkdown
  entry: string
  userRoot: string
  cliRoot: string
  clientRoot: string
  theme: string
  themeRoot: string
}

export interface SlidevPluginOptions extends SlidevEntryOptions {
  vue?: ArgumentsType<typeof Vue>[0]
  markdown?: ArgumentsType<typeof Markdown>[0]
  components?: ArgumentsType<typeof ViteComponents>[0]
  windicss?: ArgumentsType<typeof WindiCSS>[0]
  icons?: ArgumentsType<typeof ViteIcons>[0]
  remoteAssets?: ArgumentsType<typeof RemoteAssets>[0]
  slidev: ResolvedSlidevOptions
  onDataReload?: (newData: SlidevMarkdown, data: SlidevMarkdown) => void
}

export function getClientRoot() {
  return dirname(require.resolve('@slidev/client/package.json'))
}

export function getCLIRoot() {
  return resolve(__dirname, '..')
}

export function getThemeRoot(name: string) {
  return dirname(require.resolve(`${name}/package.json`))
}

export async function resolveOptions(options: SlidevEntryOptions): Promise<ResolvedSlidevOptions> {
  const {
    entry = 'slides.md',
    userRoot = process.cwd(),
  } = options
  const data = await parser.load(entry)
  const theme = options.theme || data.config.theme

  return {
    data,
    entry: resolve(userRoot, entry),
    theme,
    userRoot,
    clientRoot: getClientRoot(),
    cliRoot: getCLIRoot(),
    themeRoot: getThemeRoot(theme),
  }
}
