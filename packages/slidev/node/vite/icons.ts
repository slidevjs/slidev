import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import Icons from 'unplugin-icons/vite'

export function createIconsPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
) {
  return Icons({
    defaultClass: 'slidev-icon',
    collectionsNodeResolvePath: options.utils.iconsResolvePath,
    ...pluginOptions.icons,
  })
}
