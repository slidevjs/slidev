import { fileURLToPath } from 'node:url'
import { defineConfig, normalizePath } from 'vite'
import UnoCSS from 'unocss/vite'
import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import { createVueCompilerFlagsPlugin } from '../slidev/node/vite/compilerFlagsVue'
import { createInspectPlugin } from '../slidev/node/vite/inspect'
import { createIconsPlugin } from '../slidev/node/vite/icons'
import { createComponentsPlugin } from '../slidev/node/vite/components'
import { toAtFS } from '../slidev/node/resolver'
import { createVuePlugin } from '../slidev/node/vite/vue'

const absolute = (path: string) => normalizePath(fileURLToPath(new URL(path, import.meta.url)))
const clientRoot = absolute('../client')
const parserRoot = absolute('../parser')

const options = {
  clientRoot,
  roots: [],
  mode: 'build',
  inspect: true,
  utils: {
    defines: {
      __DEV__: 'true',
      __SLIDEV_CLIENT_ROOT__: JSON.stringify(toAtFS(clientRoot)),
      __SLIDEV_HASH_ROUTE__: false,
      __SLIDEV_FEATURE_DRAWINGS__: 'true',
      __SLIDEV_FEATURE_EDITOR__: 'true',
      __SLIDEV_FEATURE_DRAWINGS_PERSIST__: 'false',
      __SLIDEV_FEATURE_RECORD__: 'true',
      __SLIDEV_FEATURE_PRESENTER__: 'true',
      __SLIDEV_FEATURE_PRINT__: 'false',
      __SLIDEV_FEATURE_WAKE_LOCK__: 'true',
      __SLIDEV_HAS_SERVER__: 'false',
    },
  },
} as unknown as ResolvedSlidevOptions

const pluginOptions = {
  components: {
    dts: false,
  },
} as SlidevPluginOptions

export default defineConfig({
  plugins: [
    createInspectPlugin(options, pluginOptions),
    createVueCompilerFlagsPlugin(options),
    UnoCSS({
      configFile: absolute('../client/uno.config.ts'),
    }),
    createVuePlugin(options, pluginOptions),
    createComponentsPlugin(options, pluginOptions),
    createIconsPlugin(options, pluginOptions),
    {
      name: 'slidev:loader',
      resolveId: {
        order: 'pre',
        handler(id) {
          if (id.startsWith('/@slidev/') || id.includes('__slidev_') || id.startsWith('server-reactive:'))
            return id
          return null
        },
      },
      load(id) {
        if (id.startsWith('/@slidev/setups'))
          return 'export default []'
        if (id.startsWith('server-reactive:'))
          return `export default {}`
        if (id.endsWith(absolute('../client/composables/useSlideInfo.ts')))
          return `export * from '${toAtFS(absolute('./src/composables/useSlideInfo.ts'))}'`
      },
    },
  ],
  resolve: {
    alias: [
      ...Object.entries({
        '@rollup/pluginutils': absolute('./polyfills/rollup-pluginutils.ts'),
        'unplugin': absolute('./polyfills/unplugin.ts'),
        'module': absolute('./polyfills/node-module.ts'),
        'assert': absolute('./polyfills/node-assert.ts'),

        '#slidev/configs': absolute('./src/virtual/configs.ts'),
        '#slidev/global-layers': absolute('./src/virtual/global-layers.ts'),
        '#slidev/custom-nav-controls': absolute('./src/virtual/nav-controls.ts'),
        '#slidev/styles': absolute('./src/virtual/styles.ts'),
        '#slidev/title-renderer': absolute('./src/virtual/title-renderer.vue'),
        '#slidev/shiki': absolute('./src/virtual/shiki.ts'),
        '#slidev/slides': absolute('./src/virtual/slides.ts'),

        '@slidev/parser/utils': absolute('../parser/src/utils.ts'),
      }).map(([find, replacement]) => ({ find, replacement })),
      {
        find: /^@slidev\/client$/,
        replacement: `${toAtFS(clientRoot)}/index.ts`,
      },
      {
        find: /^@slidev\/parser\/(.*)/,
        replacement: `${toAtFS(parserRoot)}/$1`,
      },
      {
        find: /^#slidev\/(.*)/,
        replacement: '/@slidev/$1',
      },
    ],
  },
  define: options.utils.defines,
})
