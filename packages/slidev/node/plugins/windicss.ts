import { resolve, dirname } from 'path'
import { existsSync } from 'fs'
import { slash, uniq } from '@antfu/utils'
import WindiCSS, { defaultConfigureFiles, WindiCssOptions } from 'vite-plugin-windicss'
import { ResolvedSlidevOptions, SlidevPluginOptions } from '..'
import { resolveImportPath } from '../utils'
import { jiti } from './jiti'
import { loadSetups } from './setupNode'

export async function createWindiCSSPlugin(
  { themeRoots, clientRoot, userRoot, roots, data }: ResolvedSlidevOptions,
  { windicss: windiOptions }: SlidevPluginOptions,
) {
  const configFiles = uniq([
    ...defaultConfigureFiles,
    ...themeRoots.map(i => `${i}/windi.config.ts`),
    resolve(clientRoot, 'windi.config.ts'),
  ])

  const configFile = configFiles.find(i => existsSync(i))!
  let config = jiti(configFile) as WindiCssOptions
  if (config.default)
    config = config.default

  config = await loadSetups(roots, 'windicss.ts', {}, config, true)

  return WindiCSS(
    {
      configFiles: [configFile],
      config,
      onConfigResolved(config: any) {
        if (!config.theme)
          config.theme = {}
        if (!config.theme.extend)
          config.theme.extend = {}
        if (!config.theme.extend.fontFamily)
          config.theme.extend.fontFamily = {}

        const fontFamily = config.theme.extend.fontFamily
        fontFamily.sans ||= data.config.fonts.sans.join(',')
        fontFamily.mono ||= data.config.fonts.mono.join(',')
        fontFamily.serif ||= data.config.fonts.serif.join(',')

        return config
      },
      onOptionsResolved(config) {
        themeRoots.forEach((i) => {
          config.scanOptions.include.push(`${i}/components/*.{vue,ts}`)
          config.scanOptions.include.push(`${i}/layouts/*.{vue,ts}`)
        })
        config.scanOptions.include.push(`!${slash(resolve(userRoot, 'node_modules'))}`)
        config.scanOptions.exclude.push(dirname(resolveImportPath('monaco-editor/package.json', true)))
        config.scanOptions.exclude.push(dirname(resolveImportPath('katex/package.json', true)))
        config.scanOptions.exclude.push(dirname(resolveImportPath('prettier/package.json', true)))
      },
      ...windiOptions,
    },
    {
      hookOptions: {
        ignoreNodeModules: false,
      },
    },
  )
}
