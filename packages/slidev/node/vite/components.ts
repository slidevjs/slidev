import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import { join } from 'node:path'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

const RE_VUE_EXT = /\.vue$/
const RE_VUE_QUERY_VUE = /\.vue\?vue/
const RE_VUE_QUERY_V = /\.vue\?v=/
const RE_MD_EXT = /\.md$/
const RE_MD_QUERY_VUE = /\.md\?vue/

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
    globsExclude: [],

    include: [RE_VUE_EXT, RE_VUE_QUERY_VUE, RE_VUE_QUERY_V, RE_MD_EXT, RE_MD_QUERY_VUE],
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
