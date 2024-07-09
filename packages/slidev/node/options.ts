import path from 'node:path'
import { uniq } from '@antfu/utils'
import Debug from 'debug'
import type { ResolvedSlidevOptions, ResolvedSlidevUtils, SlidevData, SlidevEntryOptions } from '@slidev/types'
import mm from 'micromatch'
import fg from 'fast-glob'
import { parser } from './parser'
import { getThemeMeta, resolveTheme } from './integrations/themes'
import { resolveAddons } from './integrations/addons'
import { getRoots, resolveEntry } from './resolver'

const debug = Debug('slidev:options')

export async function resolveOptions(
  options: SlidevEntryOptions,
  mode: ResolvedSlidevOptions['mode'],
): Promise<ResolvedSlidevOptions> {
  const entry = await resolveEntry(options.entry)
  const rootsInfo = await getRoots(entry)
  const loaded = await parser.load(rootsInfo.userRoot, entry, undefined, mode)

  // Load theme data first, because it may affect the config
  let themeRaw = options.theme || loaded.headmatter.theme as string | null | undefined
  themeRaw = themeRaw === null ? 'none' : (themeRaw || 'default')
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

  const data: SlidevData = {
    ...loaded,
    config,
    themeMeta,
  }

  const resolved: ResolvedSlidevOptions = {
    ...rootsInfo,
    ...options,
    data,
    mode,
    entry,
    themeRaw,
    theme,
    themeRoots,
    addonRoots,
    roots,
    utils: createDataUtils(data, rootsInfo.clientRoot, roots),
  }

  return resolved
}

export function createDataUtils(data: SlidevData, clientRoot: string, roots: string[]): ResolvedSlidevUtils {
  const monacoTypesIgnorePackagesMatches = (data.config.monacoTypesIgnorePackages || [])
    .map(i => mm.matcher(i))

  let _layouts_cache_time = 0
  let _layouts_cache: Record<string, string> = {}

  return {
    isMonacoTypesIgnored: pkg => monacoTypesIgnorePackagesMatches.some(i => i(pkg)),
    getLayouts: async () => {
      const now = Date.now()
      if (now - _layouts_cache_time < 2000)
        return _layouts_cache

      const layouts: Record<string, string> = {}

      for (const root of [clientRoot, ...roots]) {
        const layoutPaths = await fg('layouts/**/*.{vue,ts}', {
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
