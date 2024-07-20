import UnoCSS from 'unocss/vite'
import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
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
