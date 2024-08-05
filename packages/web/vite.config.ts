import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import { createVueCompilerFlagsPlugin } from '../slidev/node/vite/compilerFlagsVue'
import { createInspectPlugin } from '../slidev/node/vite/inspect'
import { createIconsPlugin } from '../slidev/node/vite/icons'
import { createComponentsPlugin } from '../slidev/node/vite/components'
import { toAtFS } from '../slidev/node/resolver'
import { createVuePlugin } from '../slidev/node/vite/vue'

const absolute = (path: string) => fileURLToPath(new URL(path, import.meta.url))
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

const pluginOptions = {} as SlidevPluginOptions

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
        if (id === '/@slidev/styles')
          return `export {}`
        if (id.startsWith('server-reactive:'))
          return `export default {}`
      },
    },
  ],
  resolve: {
    alias: [
      ...Object.entries({
        '@rollup/pluginutils': absolute('./polyfills/rollup-pluginutils.ts'),
        'unplugin': absolute('./polyfills/unplugin.ts'),
        'module': absolute('./polyfills/node-module.ts'),

        '#slidev/configs': absolute('./src/configs/slidev.ts'),
        '#slidev/global-layers': absolute('./src/custom-components.ts'),
        '#slidev/custom-nav-controls': absolute('./src/custom-components.ts'),
        '#slidev/title-renderer': absolute('./src/title-renderer.vue'),
        '#slidev/shiki': absolute('./src/shiki.ts'),
        '#slidev/slides': absolute('./src/slides.ts'),
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
