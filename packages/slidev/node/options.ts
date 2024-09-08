import path from 'node:path'
import { uniq } from '@antfu/utils'
import Debug from 'debug'
import type { ResolvedSlidevOptions, ResolvedSlidevUtils, SlidevData, SlidevEntryOptions } from '@slidev/types'
import mm from 'micromatch'
import fg from 'fast-glob'
import { parser } from './parser'
import { getThemeMeta, resolveTheme } from './integrations/themes'
import { resolveAddons } from './integrations/addons'
import { getRoots, resolveEntry, toAtFS } from './resolver'
import setupShiki from './setups/shiki'
import setupIndexHtml from './setups/indexHtml'

const debug = Debug('slidev:options')

export async function resolveOptions(
  entryOptions: SlidevEntryOptions,
  mode: ResolvedSlidevOptions['mode'],
): Promise<ResolvedSlidevOptions> {
  const entry = await resolveEntry(entryOptions.entry)
  const rootsInfo = await getRoots(entry)
  const loaded = await parser.load(rootsInfo.userRoot, entry, undefined, mode)

  // Load theme data first, because it may affect the config
  let themeRaw = entryOptions.theme || loaded.headmatter.theme as string | null | undefined
  themeRaw = themeRaw === null ? 'none' : (themeRaw || 'default')
  const [theme, themeRoot] = await resolveTheme(themeRaw, entry)
  const themeRoots = themeRoot ? [themeRoot] : []
  const themeMeta = themeRoot ? await getThemeMeta(theme, themeRoot) : undefined

  const config = parser.resolveConfig(loaded.headmatter, themeMeta, entryOptions.entry)
  const addonRoots = await resolveAddons(config.addons)
  const roots = uniq([...themeRoots, ...addonRoots, rootsInfo.userRoot])

  debug({
    ...rootsInfo,
    ...entryOptions,
    config,
    mode,
    entry,
    themeRaw,
    theme,
    themeRoots,
    addonRoots,
    roots,
  })

  const data: SlidevData = {
    ...loaded,
    config,
    themeMeta,
  }

  const resolved: ResolvedSlidevOptions = {
    ...rootsInfo,
    ...entryOptions,
    data,
    mode,
    entry,
    themeRaw,
    theme,
    themeRoots,
    addonRoots,
    roots,
    utils: null!,
  }

  resolved.utils = await createDataUtils(resolved)

  return resolved
}

type OptionsWithoutUtils = Omit<ResolvedSlidevOptions, 'utils'>

export async function createDataUtils(options: OptionsWithoutUtils): Promise<ResolvedSlidevUtils> {
  const monacoTypesIgnorePackagesMatches = (options.data.config.monacoTypesIgnorePackages || [])
    .map(i => mm.matcher(i))

  let _layouts_cache_time = 0
  let _layouts_cache: Record<string, string> = {}

  return {
    ...await setupShiki(options.roots),
    indexHtml: setupIndexHtml(options),
    define: getDefine(options),
    iconsResolvePath: [resolved.clientRoot, ...resolved.roots].reverse(),
    isMonacoTypesIgnored: pkg => monacoTypesIgnorePackagesMatches.some(i => i(pkg)),
    getLayouts: () => {
      const now = Date.now()
      if (now - _layouts_cache_time < 2000)
        return _layouts_cache

      const layouts: Record<string, string> = {}

      for (const root of [options.clientRoot, ...options.roots]) {
        const layoutPaths = fg.sync('layouts/**/*.{vue,ts}', {
          cwd: root,
          absolute: true,
          suppressErrors: true,
        })

        for (const layoutPath of layoutPaths) {
          const layoutName = path.basename(layoutPath).replace(/\.\w+$/, '')
          layouts[layoutName] = layoutPath
        }
      }

      _layouts_cache_time = now
      _layouts_cache = layouts

      return layouts
    },
  }
}

function getDefine(options: OptionsWithoutUtils): Record<string, string> {
  return {
    __DEV__: options.mode === 'dev' ? 'true' : 'false',
    __SLIDEV_CLIENT_ROOT__: JSON.stringify(toAtFS(options.clientRoot)),
    __SLIDEV_HASH_ROUTE__: JSON.stringify(options.data.config.routerMode === 'hash'),
    __SLIDEV_FEATURE_DRAWINGS__: JSON.stringify(options.data.config.drawings.enabled === true || options.data.config.drawings.enabled === options.mode),
    __SLIDEV_FEATURE_EDITOR__: JSON.stringify(options.mode === 'dev' && options.data.config.editor !== false),
    __SLIDEV_FEATURE_DRAWINGS_PERSIST__: JSON.stringify(!!options.data.config.drawings.persist === true),
    __SLIDEV_FEATURE_RECORD__: JSON.stringify(options.data.config.record === true || options.data.config.record === options.mode),
    __SLIDEV_FEATURE_PRESENTER__: JSON.stringify(options.data.config.presenter === true || options.data.config.presenter === options.mode),
    __SLIDEV_FEATURE_PRINT__: JSON.stringify(options.mode === 'export' || (options.mode === 'build' && [true, 'true', 'auto'].includes(options.data.config.download))),
    __SLIDEV_FEATURE_WAKE_LOCK__: JSON.stringify(options.data.config.wakeLock === true || options.data.config.wakeLock === options.mode),
    __SLIDEV_HAS_SERVER__: options.mode !== 'build' ? 'true' : 'false',
  }
}
