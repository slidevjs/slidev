import { dirname, resolve } from 'path'
import { existsSync } from 'fs'
import { slash, uniq } from '@antfu/utils'
import type { WindiCssOptions } from 'vite-plugin-windicss'
import jiti from 'jiti'
import type { ResolvedSlidevOptions, SlidevPluginOptions } from '..'
import { resolveImportPath } from '../utils'
import { loadSetups } from './setupNode'

export async function createWindiCSSPlugin(
  { themeRoots, addonRoots, clientRoot, userRoot, roots, data }: ResolvedSlidevOptions,
  { windicss: windiOptions }: SlidevPluginOptions,
) {
  const { default: WindiCSS } = await import('vite-plugin-windicss')
  const { defaultConfigureFiles } = await import('@windicss/config')

  const configFiles = uniq([
    ...defaultConfigureFiles.map(i => resolve(userRoot, i)),
    ...themeRoots.map(i => `${i}/windi.config.ts`),
    ...addonRoots.map(i => `${i}/windi.config.ts`),
    resolve(clientRoot, 'windi.config.ts'),
  ])

  const configFile = configFiles.find(i => existsSync(i))!
  let config = jiti(__filename)(configFile) as WindiCssOptions
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
          config.scanOptions.include.push(`${i}/components/**/*.{vue,ts}`)
          config.scanOptions.include.push(`${i}/layouts/**/*.{vue,ts}`)
        })
        addonRoots.forEach((i) => {
          config.scanOptions.include.push(`${i}/components/**/*.{vue,ts}`)
          config.scanOptions.include.push(`${i}/layouts/**/*.{vue,ts}`)
        })
        config.scanOptions.include.push(`!${slash(resolve(userRoot, 'node_modules'))}`)
        config.scanOptions.exclude.push(dirname(resolveImportPath('monaco-editor/package.json', true)))
        config.scanOptions.exclude.push(dirname(resolveImportPath('katex/package.json', true)))
        config.scanOptions.exclude.push(dirname(resolveImportPath('prettier/package.json', true)))
      },
      ...windiOptions,
    },
  )
}
