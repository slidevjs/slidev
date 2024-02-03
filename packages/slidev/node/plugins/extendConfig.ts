import { dirname, join } from 'node:path'
import type { InlineConfig, Plugin } from 'vite'
import { mergeConfig } from 'vite'
import isInstalledGlobally from 'is-installed-globally'
import { uniq } from '@antfu/utils'
import { getIndexHtml } from '../common'
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
  'vue-demi',
  'vue',
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
          dedupe: ['vue'],
        },
        optimizeDeps: {
          exclude: EXCLUDE,
        },
        css: options.data.config.css === 'unocss'
          ? {
              postcss: {
                plugins: [
                  await import('postcss-nested').then(r => (r.default || r)()) as any,
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
                  ? [
                      dirname(await resolveGlobalImportPath('@slidev/client/package.json')),
                      dirname(await resolveGlobalImportPath('katex/package.json')),
                    ]
                  : []
              ),
            ]),
          },
        },
        publicDir: join(options.userRoot, 'public'),
      }

      injection.resolve ||= {}
      injection.resolve.alias ||= {}

      if (isInstalledGlobally) {
        injection.cacheDir = join(options.cliRoot, 'node_modules/.vite')
        injection.root = options.cliRoot
      }

      // @ts-expect-error type cast
      injection.resolve.alias.vue = await resolveImportPath('vue/dist/vue.esm-browser.js', true)

      return mergeConfig(injection, config)
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
    __DEV__: options.mode === 'dev' ? 'true' : 'false',
    __SLIDEV_CLIENT_ROOT__: JSON.stringify(toAtFS(options.clientRoot)),
    __SLIDEV_HASH_ROUTE__: JSON.stringify(options.data.config.routerMode === 'hash'),
    __SLIDEV_FEATURE_DRAWINGS__: JSON.stringify(options.data.config.drawings.enabled === true || options.data.config.drawings.enabled === options.mode),
    __SLIDEV_FEATURE_EDITOR__: JSON.stringify(options.mode === 'dev' && options.data.config.editor !== false),
    __SLIDEV_FEATURE_DRAWINGS_PERSIST__: JSON.stringify(!!options.data.config.drawings.persist === true),
    __SLIDEV_FEATURE_RECORD__: JSON.stringify(options.data.config.record === true || options.data.config.record === options.mode),
    __SLIDEV_FEATURE_PRESENTER__: JSON.stringify(options.data.config.presenter === true || options.data.config.presenter === options.mode),
    __SLIDEV_HAS_SERVER__: options.mode !== 'build' ? 'true' : 'false',
  }
}
