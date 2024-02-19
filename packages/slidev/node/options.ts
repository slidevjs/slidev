import type Vue from '@vitejs/plugin-vue'
import type VueJsx from '@vitejs/plugin-vue-jsx'
import type Icons from 'unplugin-icons/vite'
import type Components from 'unplugin-vue-components/vite'
import type Markdown from 'unplugin-vue-markdown/vite'
import type { VitePluginConfig as UnoCSSConfig } from 'unocss/vite'
import type RemoteAssets from 'vite-plugin-remote-assets'
import type ServerRef from 'vite-plugin-vue-server-ref'
import type { ArgumentsType } from '@antfu/utils'
import { uniq } from '@antfu/utils'
import type { SlidevData } from '@slidev/types'
import _debug from 'debug'
import { parser } from './parser'
import { getThemeMeta, resolveTheme } from './themes'
import { resolveAddons } from './addons'
import { cliRoot, clientRoot, resolveEntry, userRoot } from './fs'

const debug = _debug('slidev:options')

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
   * Remote password
   */
  remote?: string

  /**
   * Root path
   *
   * @default process.cwd()
   */
  userRoot?: string

  /**
   * Enable inspect plugin
   */
  inspect?: boolean
}

export interface ResolvedSlidevOptions {
  data: SlidevData
  entry: string
  theme: string | null
  themeRoots: string[]
  addonRoots: string[]
  /**
   * =`[...themeRoots, ...addonRoots, userRoot]` (`clientRoot` excluded)
   */
  roots: string[]
  mode: 'dev' | 'build' | 'export'
  remote?: string
  inspect?: boolean
}

export interface SlidevPluginOptions extends SlidevEntryOptions {
  vue?: ArgumentsType<typeof Vue>[0]
  vuejsx?: ArgumentsType<typeof VueJsx>[0]
  markdown?: ArgumentsType<typeof Markdown>[0]
  components?: ArgumentsType<typeof Components>[0]
  icons?: ArgumentsType<typeof Icons>[0]
  remoteAssets?: ArgumentsType<typeof RemoteAssets>[0]
  serverRef?: ArgumentsType<typeof ServerRef>[0]
  unocss?: UnoCSSConfig
}

export interface SlidevServerOptions {
  onDataReload?: (newData: SlidevData, data: SlidevData) => void
}

export async function resolveOptions(
  options: SlidevEntryOptions,
  mode: ResolvedSlidevOptions['mode'],
): Promise<ResolvedSlidevOptions> {
  const { remote, inspect } = options
  const entry = resolveEntry(options.entry || 'slides.md')
  const data = await parser.load(userRoot, entry)
  const [theme, themeRoot] = await resolveTheme(options.theme || data.config.theme, entry)
  const themeRoots = themeRoot ? [themeRoot] : []
  const addonRoots = await resolveAddons(data.config.addons)
  const roots = uniq([...themeRoots, ...addonRoots, userRoot])

  if (themeRoot) {
    const themeMeta = await getThemeMeta(theme, themeRoot)
    data.config = parser.resolveConfig(data.headmatter, themeMeta, options.entry)
  }

  debug({
    config: data.config,
    mode,
    entry,
    theme,
    userRoot,
    clientRoot,
    cliRoot,
    themeRoots,
    addonRoots,
    roots,
    remote,
  })

  return {
    data,
    mode,
    entry,
    theme,
    themeRoots,
    addonRoots,
    roots,
    remote,
    inspect,
  }
}
