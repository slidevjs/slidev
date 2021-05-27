import { join } from 'path'
import { InlineConfig, mergeConfig, Plugin } from 'vite'
import isInstalledGlobally from 'is-installed-globally'
import { getIndexHtml } from '../common'
import { dependencies } from '../../../client/package.json'
import { ResolvedSlidevOptions } from '../options'
import { resolveImportPath, toAtFS } from '../utils'

const EXCLUDE = [
  '@slidev/shared',
  '@slidev/types',
  '@vueuse/core',
  '@vueuse/shared',
  'mermaid',
  'vite-plugin-windicss',
  'vue-demi',
]

export function createConfigPlugin(options: ResolvedSlidevOptions): Plugin {
  return {
    name: 'slidev:config',
    config(config) {
      const injection: InlineConfig = {
        define: {
          __SLIDEV_CLIENT_ROOT__: JSON.stringify(toAtFS(options.clientRoot)),
          __SLIDEV_HASH_ROUTE__: options.data.config.routerMode === 'hash',
          __DEV__: options.mode === 'dev' ? 'true' : 'false',
        },
        resolve: {
          alias: {
            '@slidev/client/': `${toAtFS(options.clientRoot)}/`,
          },
        },
        optimizeDeps: {
          include: [
            ...Object.keys(dependencies).filter(i => !EXCLUDE.includes(i)),
            'codemirror/mode/javascript/javascript',
            'codemirror/mode/css/css',
            'codemirror/mode/markdown/markdown',
            'codemirror/mode/xml/xml',
            'codemirror/mode/htmlmixed/htmlmixed',
            'prettier/esm/parser-babel',
            'prettier/esm/parser-html',
            'prettier/esm/parser-typescript',
            'mermaid/dist/mermaid.min',
          ],
          exclude: EXCLUDE,
        },
      }

      if (isInstalledGlobally) {
        injection.cacheDir = join(options.cliRoot, 'node_modules/.vite')
        injection.root = options.cliRoot
        // @ts-expect-error
        injection.resolve.alias.vue = `${resolveImportPath('vue/dist/vue.esm-browser.js', true)}`
      }

      return mergeConfig(config, injection)
    },
    configureServer(server) {
      // serve our index.html after vite history fallback
      return () => {
        server.middlewares.use(async(req, res, next) => {
          if (req.url!.endsWith('.html')) {
            res.statusCode = 200
            res.end(await getIndexHtml(options))
            return
          }
          next()
        })
      }
    },
  }
}
