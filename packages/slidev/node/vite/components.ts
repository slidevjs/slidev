import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import { join } from 'node:path'
import { slash } from '@antfu/utils'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

const RE_VUE_EXT = /\.vue$/
const RE_VUE_QUERY_VUE = /\.vue\?vue/
const RE_VUE_QUERY_V = /\.vue\?v=/
const RE_MD_EXT = /\.md$/
const RE_MD_QUERY_VUE = /\.md\?vue/
const RE_GLOB_SPECIAL_PATH_CHARS = /[()|]/g

export function createPipePathComponentGlobs(dirs: string[], extensions: string[]) {
  if (!extensions.length || !dirs.some(dir => dir.includes('|')))
    return

  const extensionGlob = extensions.length === 1
    ? extensions[0]
    : `{${extensions.join(',')}}`

  return dirs.map((dir) => {
    const escapedDir = slash(dir).replace(RE_GLOB_SPECIAL_PATH_CHARS, '\\$&')
    return `${escapedDir}/**/*.${extensionGlob}`
  })
}

export function createComponentsPlugin(
  { clientRoot, roots }: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
) {
  const options = {
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
  }

  if (options.globs == null) {
    const dirs = Array.isArray(options.dirs) ? options.dirs : [options.dirs]
    const extensions = Array.isArray(options.extensions) ? options.extensions : [options.extensions]
    options.globs = createPipePathComponentGlobs(dirs, extensions)
  }

  return Components(options)
}
