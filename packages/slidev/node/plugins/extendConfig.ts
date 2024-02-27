import { join } from 'node:path'
import type { InlineConfig, Plugin } from 'vite'
import { mergeConfig } from 'vite'
import isInstalledGlobally from 'is-installed-globally'
import { uniq } from '@antfu/utils'
import { getIndexHtml } from '../common'
import type { ResolvedSlidevOptions } from '../options'
import { resolveImportPath, toAtFS } from '../resolver'
import { dependencies } from '../../../client/package.json'

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
  'shiki',
]

const ASYNC_MODULES = [
  'file-saver',
  'vue',
  '@vue',
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
            '#slidev/': '/@slidev/',
            'vue': await resolveImportPath('vue/dist/vue.esm-browser.js', true),
          },
          dedupe: ['vue'],
        },
        optimizeDeps: {
          exclude: EXCLUDE,
          include: Object.keys(dependencies)
            .filter(i => !EXCLUDE.includes(i))
            // We need to specify the full deps path for non-hoisted modules
            .map(i => `@slidev/cli > @slidev/client > ${i}`),
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
              options.userWorkspaceRoot,
              options.cliRoot,
              options.clientRoot,
              ...options.roots,
            ]),
          },
        },
        publicDir: join(options.userRoot, 'public'),
        build: {
          rollupOptions: {
            output: {
              chunkFileNames(chunkInfo) {
                const DEFAULT = 'assets/[name]-[hash].js'

                // Already handled in manualChunks
                if (chunkInfo.name.includes('/'))
                  return DEFAULT

                // Over 60% of the chunk is slidev client code, we put it into slidev chunk
                if (chunkInfo.moduleIds.filter(i => isSlidevClient(i)).length > chunkInfo.moduleIds.length * 0.6)
                  return 'assets/slidev/[name]-[hash].js'

                // Monaco Editor
                if (chunkInfo.moduleIds.filter(i => i.match(/\/monaco-editor(-core)?\//)).length > chunkInfo.moduleIds.length * 0.6)
                  return 'assets/monaco/[name]-[hash].js'

                return DEFAULT
              },
              manualChunks(id) {
                if (id.startsWith('/@slidev-monaco-types/') || id.includes('/@slidev/monaco-types') || id.endsWith('?monaco-types&raw'))
                  return 'monaco/bundled-types'
                if (id.includes('/shiki/') || id.includes('/@shikijs/'))
                  return `modules/shiki`
                if (id.startsWith('~icons/'))
                  return 'modules/unplugin-icons'
                // It seems that moving slides out will breaks the production build
                // Would need to find a better way to handle this
                // const slideMatch = id.match(/\/@slidev\/slides\/(\d+)/)
                // if (slideMatch && !id.includes('.frontmatter'))
                //   return `slides/${slideMatch[1]}`

                const matchedAsyncModule = ASYNC_MODULES.find(i => id.includes(`/node_modules/${i}`))
                if (matchedAsyncModule)
                  return `modules/${matchedAsyncModule.replace('@', '').replace('/', '-')}`
              },
            },
          },
        },
      }

      function isSlidevClient(id: string) {
        return id.includes('/@slidev/') || id.includes('/slidev/packages/client/') || id.includes('/@vueuse/')
      }

      // function getNodeModuleName(path: string) {
      //   const nodeModuelsMatch = [...path.matchAll(/node_modules\/(@[^/]+\/[^/]+|[^/]+)\//g)]
      //   if (nodeModuelsMatch.length)
      //     return nodeModuelsMatch[nodeModuelsMatch.length - 1][1]
      // }

      if (isInstalledGlobally) {
        injection.cacheDir = join(options.cliRoot, 'node_modules/.vite')
        injection.root = options.cliRoot
      }

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
