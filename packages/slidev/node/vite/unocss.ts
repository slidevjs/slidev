import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import UnoCSS from 'unocss/vite'
import setupUnocss from '../setups/unocss'

export async function createUnocssPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
) {
  return UnoCSS({
    configFile: false,
    ...await setupUnocss(options),
    ...pluginOptions.unocss,
  })
}
