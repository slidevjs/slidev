import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import { join } from 'node:path'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

export function createComponentsPlugin(
  { clientRoot, roots }: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
) {
  return Components({
    extensions: ['vue', 'md', 'js', 'ts', 'jsx', 'tsx'],

    dirs: [
      join(clientRoot, 'builtin'),
      ...roots.map(i => join(i, 'components')),
    ],

    include: [/\.vue$/, /\.vue\?vue/, /\.vue\?v=/, /\.md$/, /\.md\?vue/],
    exclude: [],

    resolvers: [
      IconsResolver({
        prefix: '',
        customCollections: Object.keys(pluginOptions.icons?.customCollections || []),
      }),
    ],

    dts: false,

    ...pluginOptions.components,
  })
}
