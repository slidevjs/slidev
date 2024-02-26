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
import { getRoots, resolveEntry } from './resolver'
import type { RootsInfo } from './resolver'

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
   * Enable inspect plugin
   */
  inspect?: boolean
}

export interface ResolvedSlidevOptions extends RootsInfo {
  data: SlidevData
  entry: string
  themeRaw: string
  theme: string
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
  /**
   * @returns `false` if server should be restarted
   */
  loadData?: () => Promise<SlidevData | false>
}

export async function resolveOptions(
  options: SlidevEntryOptions,
  mode: ResolvedSlidevOptions['mode'],
): Promise<ResolvedSlidevOptions> {
  const rootsInfo = await getRoots()
  const entry = await resolveEntry(options.entry || 'slides.md', rootsInfo)
  const loaded = await parser.load(rootsInfo.userRoot, entry, undefined, mode)

  // Load theme data first, because it may affect the config
  const themeRaw = options.theme || loaded.headmatter.theme as string || 'default'
  const [theme, themeRoot] = await resolveTheme(themeRaw, entry)
  const themeRoots = themeRoot ? [themeRoot] : []
  const themeMeta = themeRoot ? await getThemeMeta(theme, themeRoot) : undefined

  const config = parser.resolveConfig(loaded.headmatter, themeMeta, options.entry)
  const addonRoots = await resolveAddons(config.addons)
  const roots = uniq([...themeRoots, ...addonRoots, rootsInfo.userRoot])

  debug({
    ...rootsInfo,
    ...options,
    config,
    mode,
    entry,
    themeRaw,
    theme,
    themeRoots,
    addonRoots,
    roots,
  })

  return {
    ...rootsInfo,
    ...options,
    data: {
      ...loaded,
      config,
      themeMeta,
    },
    mode,
    entry,
    themeRaw,
    theme,
    themeRoots,
    addonRoots,
    roots,
  }
}
