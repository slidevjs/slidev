import { fileURLToPath } from 'node:url'
import { basename } from 'node:path'
import { defineConfig, normalizePath } from 'vite'
import UnoCSS from 'unocss/vite'
import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
import fg from 'fast-glob'
import { createInspectPlugin } from '../slidev/node/vite/inspect'
import { createIconsPlugin } from '../slidev/node/vite/icons'
import { createVuePlugin } from '../slidev/node/vite/vue'

const absolute = (path: string) => normalizePath(fileURLToPath(new URL(path, import.meta.url)))
const clientRoot = absolute('.')

const options = {
  clientRoot,
  roots: [],
  mode: 'build',
  inspect: true,
} as unknown as ResolvedSlidevOptions

const pluginOptions = {
  components: {
    dts: false,
  },
} as SlidevPluginOptions

const defines = [
  '__DEV__',
  '__SLIDEV_CLIENT_ROOT__',
  '__SLIDEV_HASH_ROUTE__',
  '__SLIDEV_FEATURE_DRAWINGS__',
  '__SLIDEV_FEATURE_EDITOR__',
  '__SLIDEV_FEATURE_DRAWINGS_PERSIST__',
  '__SLIDEV_FEATURE_RECORD__',
  '__SLIDEV_FEATURE_PRESENTER__',
  '__SLIDEV_FEATURE_PRINT__',
  '__SLIDEV_FEATURE_WAKE_LOCK__',
  '__SLIDEV_HAS_SERVER__',
]

const builtinComponents = Object.fromEntries(fg.sync('*', {
  cwd: absolute('./builtin'),
  absolute: true,
}).map(i => [`components/${basename(i).replace(/\..*$/, '')}`, i]))

const layoutComponents = Object.fromEntries(fg.sync('*', {
  cwd: absolute('./layouts'),
  absolute: true,
}).map(i => [`layouts/${basename(i).replace(/\..*$/, '')}`, i]))

const externals = [
  '#slidev/',
  '/@slidev/',
  '@slidev/',
  'server-reactive:',
  'vue',
  'vue-router',
  'monaco-editor',
  'typescript',
  'mermaid',
  '~icons/',
]

export default defineConfig({
  plugins: [
    createInspectPlugin(options, pluginOptions),
    UnoCSS(),
    createVuePlugin(options, pluginOptions),
    Components({
      extensions: ['vue', 'ts'],
      dirs: [absolute('./builtin')],
      resolvers: [
        IconsResolver({
          prefix: '',
          customCollections: Object.keys(pluginOptions.icons?.customCollections || []),
        }),
      ],
      dts: false,
    }),
    createIconsPlugin(options, pluginOptions),
    {
      name: 'slidev:flags',
      enforce: 'pre',
      transform(code, id) {
        if (id.match(/\.vue($|\?)/)) {
          const original = code
          defines.forEach((name) => {
            code = code.replaceAll(`_ctx.${name}`, name)
          })
          if (original !== code)
            return code
        }
      },
    },
  ],
  build: {
    lib: {
      entry: {
        'main': absolute('./main.ts'),
        'index': absolute('./index.ts'),
        'uno.css': absolute('./uno.ts'),
        ...builtinComponents,
        ...layoutComponents,
      },
      formats: ['es'],
    },
    target: 'esnext',
    rollupOptions: {
      external: source => externals.some(i => source.startsWith(i)),
    },
  },
})
