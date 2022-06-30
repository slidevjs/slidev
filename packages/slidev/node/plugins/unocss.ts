import { resolve } from 'path'
import { existsSync } from 'fs'
import { deepMerge, uniq } from '@antfu/utils'
import type { Theme } from '@unocss/preset-uno'
import jiti from 'jiti'
import type { VitePluginConfig as UnoCSSConfig } from 'unocss/vite'
import type { ResolvedSlidevOptions, SlidevPluginOptions } from '..'
import { loadSetups } from './setupNode'

export async function createUnocssPlugin(
  { themeRoots, addonRoots, clientRoot, roots, data }: ResolvedSlidevOptions,
  { unocss: unoOptions }: SlidevPluginOptions,
) {
  const UnoCSS = await import('unocss/vite').then(r => r.default)
  const configFiles = uniq([
    ...themeRoots.map(i => `${i}/uno.config.ts`),
    ...addonRoots.map(i => `${i}/uno.config.ts`),
    resolve(clientRoot, 'uno.config.ts'),
  ])

  const configFile = configFiles.find(i => existsSync(i))!
  let config = jiti(__filename)(configFile) as UnoCSSConfig<Theme> | { default: UnoCSSConfig }
  if ('default' in config)
    config = config.default

  config = await loadSetups(roots, 'unocss.ts', {}, config, true)

  config.theme ||= {}
  config.theme.fontFamily ||= {}
  config.theme.fontFamily.sans ||= data.config.fonts.sans.join(',')
  config.theme.fontFamily.mono ||= data.config.fonts.mono.join(',')
  config.theme.fontFamily.serif ||= data.config.fonts.serif.join(',')

  return UnoCSS({
    configFile: false,
    ...deepMerge(config, unoOptions || {}) as UnoCSSConfig,
  })
}
