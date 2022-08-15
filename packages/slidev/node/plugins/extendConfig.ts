import { dirname, join } from 'path'
import type { InlineConfig, Plugin } from 'vite'
import { mergeConfig } from 'vite'
import isInstalledGlobally from 'is-installed-globally'
import { uniq } from '@antfu/utils'
import { getIndexHtml } from '../common'
import { dependencies } from '../../../client/package.json'
import type { ResolvedSlidevOptions } from '../options'
import { resolveGlobalImportPath, resolveImportPath, toAtFS } from '../utils'
import { searchForWorkspaceRoot } from '../vite/searchRoot'

const EXCLUDE = [
  '@slidev/shared',
  '@slidev/types',
  '@slidev/client',
  '@slidev/client/constants',
  '@slidev/client/logic/dark',
  '@vueuse/core',
  '@vueuse/shared',
  '@unocss/reset',
  'unocss',
  'mermaid',
  'vite-plugin-windicss',
  'vue-demi',
]

export function createConfigPlugin(options: ResolvedSlidevOptions): Plugin {
  return {
    name: 'slidev:config',
    async config(config) {
      const injection: InlineConfig = {
        define: getDefine(options),
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
            'codemirror/addon/display/placeholder',
            'prettier/esm/parser-babel',
            'prettier/esm/parser-html',
            'prettier/esm/parser-typescript',
            'mermaid/dist/mermaid.min',
            'mermaid/dist/mermaid',
            'vite-plugin-vue-server-ref/client',
          ],
          exclude: EXCLUDE,
        },
        css: options.data.config.css === 'unocss'
          ? {
              postcss: {
                plugins: [
                  await import('postcss-nested').then(r => r.default()) as any,
                ],
              },
            }
          : {},
        server: {
          fs: {
            strict: true,
            allow: uniq([
              searchForWorkspaceRoot(options.userRoot),
              searchForWorkspaceRoot(options.cliRoot),
              ...(
                isInstalledGlobally
                  ? [dirname(resolveGlobalImportPath('@slidev/client/package.json')), dirname(resolveGlobalImportPath('katex/package.json'))]
                  : []
              ),
            ]),
          },
        },
      }

      if (isInstalledGlobally) {
        injection.cacheDir = join(options.cliRoot, 'node_modules/.vite')
        injection.publicDir = join(options.userRoot, 'public')
        injection.root = options.cliRoot
        // @ts-expect-error type cast
        injection.resolve.alias.vue = `${resolveImportPath('vue/dist/vue.esm-browser.js', true)}`
      }

      return mergeConfig(config, injection)
    },
    configureServer(server) {
      // serve our index.html after vite history fallback
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (req.url!.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html')
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

export function getDefine(options: ResolvedSlidevOptions): Record<string, string> {
  return {
    __SLIDEV_CLIENT_ROOT__: JSON.stringify(toAtFS(options.clientRoot)),
    __SLIDEV_HASH_ROUTE__: JSON.stringify(options.data.config.routerMode === 'hash'),
    __SLIDEV_FEATURE_DRAWINGS__: JSON.stringify(options.data.config.drawings.enabled === true || options.data.config.drawings.enabled === options.mode),
    __SLIDEV_FEATURE_DRAWINGS_PERSIST__: JSON.stringify(!!options.data.config.drawings.persist === true),
    __SLIDEV_FEATURE_RECORD__: JSON.stringify(options.data.config.record === true || options.data.config.record === options.mode),
    __DEV__: options.mode === 'dev' ? 'true' : 'false',
  }
}
