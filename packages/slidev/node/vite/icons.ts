import { fileURLToPath } from 'node:url'
import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import Icons from 'unplugin-icons/vite'

export function createIconsPlugin(
  _options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
) {
  return Icons({
    defaultClass: 'slidev-icon',
    collectionsNodeResolvePath: fileURLToPath(import.meta.url),
    ...pluginOptions.icons,
  })
}
