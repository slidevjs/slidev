import { uniq } from '@antfu/utils'
import Debug from 'debug'
import type { ResolvedSlidevOptions, SlidevEntryOptions } from '@slidev/types'
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
