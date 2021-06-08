import { resolve, dirname, join } from 'path'
import Vue from '@vitejs/plugin-vue'
import ViteIcons from 'vite-plugin-icons'
import ViteComponents from 'vite-plugin-components'
import Markdown from 'vite-plugin-md'
import WindiCSS from 'vite-plugin-windicss'
import RemoteAssets from 'vite-plugin-remote-assets'
import { ArgumentsType, uniq } from '@antfu/utils'
import { SlidevMarkdown } from '@slidev/types'
import * as parser from '@slidev/parser/fs'
import _debug from 'debug'
import { resolveImportPath } from './utils'
import { getThemeMeta, packageExists, promptForThemeInstallation, resolveThemeName } from './themes'

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
  themeRoots: string[]
  roots: string[]
  mode: 'dev' | 'build'
}

export interface SlidevPluginOptions extends SlidevEntryOptions {
  vue?: ArgumentsType<typeof Vue>[0]
  markdown?: ArgumentsType<typeof Markdown>[0]
  components?: ArgumentsType<typeof ViteComponents>[0]
  windicss?: ArgumentsType<typeof WindiCSS>[0]
  icons?: ArgumentsType<typeof ViteIcons>[0]
  remoteAssets?: ArgumentsType<typeof RemoteAssets>[0]
  onDataReload?: (newData: SlidevMarkdown, data: SlidevMarkdown) => void
}

export function getClientRoot() {
  return dirname(resolveImportPath('@slidev/client/package.json', true))
}

export function getCLIRoot() {
  return resolve(__dirname, '..')
}

export function isPath(name: string) {
  return name.startsWith('/') || /^\.\.?[\/\\]/.test(name)
}

export function getThemeRoots(name: string, entry: string) {
  if (!name)
    return []

  // TODO: handle theme inherit
  if (isPath(name)) {
    return [
      resolve(dirname(entry), name),
    ]
  }
  else {
    return [
      dirname(resolveImportPath(`${name}/package.json`, true)),
    ]
  }
}

export async function resolveOptions(
  options: SlidevEntryOptions,
  mode: ResolvedSlidevOptions['mode'],
  promptForInstallation = true,
): Promise<ResolvedSlidevOptions> {
  const {
    entry: rawEntry = 'slides.md',
    userRoot = process.cwd(),
  } = options
  const entry = resolve(userRoot, rawEntry)
  const data = await parser.load(entry)
  const theme = resolveThemeName(options.theme || data.config.theme)

  if (promptForInstallation) {
    if (await promptForThemeInstallation(theme) === false)
      process.exit(1)
  }
  else {
    if (!packageExists(theme)) {
      // eslint-disable-next-line no-console
      console.error(`Theme "${theme}" not found, have you installed it?`)
      process.exit(1)
    }
  }

  const clientRoot = getClientRoot()
  const cliRoot = getCLIRoot()
  const themeRoots = getThemeRoots(theme, entry)
  const roots = uniq([clientRoot, ...themeRoots, userRoot])

  if (themeRoots.length) {
    const themeMeta = await getThemeMeta(theme, join(themeRoots[0], 'package.json'))
    data.themeMeta = themeMeta
    if (themeMeta)
      data.config = parser.resolveConfig(data.headmatter, themeMeta)
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
    roots,
  })

  return {
    data,
    mode,
    entry,
    theme,
    userRoot,
    clientRoot,
    cliRoot,
    themeRoots,
    roots,
  }
}
