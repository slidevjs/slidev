import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { InlineConfig, Plugin } from 'vite'
import { mergeConfig } from 'vite'
import { slash, uniq } from '@antfu/utils'
import type { ResolvedSlidevOptions } from '@slidev/types'
import { createResolve } from 'mlly'
import { getIndexHtml } from '../commands/shared'
import { isInstalledGlobally, resolveImportPath, toAtFS } from '../resolver'

const INCLUDE_GLOBAL = [
  '@shikijs/monaco',
  '@shikijs/vitepress-twoslash/client',
  '@slidev/rough-notation',
  '@typescript/ata',
  '@unhead/vue',
  'drauu',
  'file-saver',
  'floating-vue',
  'fuse.js',
  'lz-string',
  'prettier',
  'recordrtc',
  'typescript',
  'vue-router',
  'yaml',
  'shiki-magic-move/vue',
]

const INCLUDE_LOCAL = [
  ...INCLUDE_GLOBAL,

  'codemirror',
  'codemirror/mode/javascript/javascript',
  'codemirror/mode/css/css',
  'codemirror/mode/markdown/markdown',
  'codemirror/mode/xml/xml',
  'codemirror/mode/htmlmixed/htmlmixed',
  'codemirror/addon/display/placeholder',

  'monaco-editor',
  'monaco-editor/esm/vs/platform/contextview/browser/contextViewService',
  'monaco-editor/esm/vs/platform/instantiation/common/descriptors',
  'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices',
].map(i => `@slidev/cli > @slidev/client > ${i}`)

const EXCLUDE_GLOBAL = [
  '@slidev/types',
  '@slidev/client',
  '@slidev/client/constants',
  '@slidev/client/logic/dark',
  '@antfu/utils',
  '@vueuse/core',
  '@vueuse/math',
  '@vueuse/shared',
  '@vueuse/motion',
  '@unocss/reset',
  'mermaid',
  'vue-demi',
  'vue',
]

const EXCLUDE_LOCAL = [
  ...EXCLUDE_GLOBAL,
  ...[
    '@slidev/client',
    '@slidev/client/constants',
    '@slidev/client/logic/dark',
    '@slidev/client > @antfu/utils',
    '@slidev/client > @slidev/types',
    '@slidev/client > @vueuse/core',
    '@slidev/client > @vueuse/math',
    '@slidev/client > @vueuse/shared',
    '@slidev/client > @vueuse/motion',
    '@slidev/client > @unocss/reset',
    '@slidev/client > mermaid',
    '@slidev/client > vue-demi',
    '@slidev/client > vue',
  ].map(i => `@slidev/cli > ${i}`),
]

const ASYNC_MODULES = [
  'file-saver',
  'vue',
  '@vue',
]

export function createConfigPlugin(options: ResolvedSlidevOptions): Plugin {
  const resolveClientDep = createResolve({
    // Same as Vite's default resolve conditions
    conditions: ['import', 'module', 'browser', 'default', options.mode === 'build' ? 'production' : 'development'],
    url: pathToFileURL(options.clientRoot),
  })
  return {
    name: 'slidev:config',
    async config(config) {
      const injection: InlineConfig = {
        define: getDefine(options),
        resolve: {
          alias: [
            {
              find: /^@slidev\/client$/,
              replacement: `${toAtFS(options.clientRoot)}/index.ts`,
            },
            {
              find: /^@slidev\/client\/(.*)/,
              replacement: `${toAtFS(options.clientRoot)}/$1`,
            },
            {
              find: /^#slidev\/(.*)/,
              replacement: '/@slidev/$1',
            },
            {
              find: 'vue',
              replacement: await resolveImportPath('vue/dist/vue.esm-bundler.js', true),
            },
            ...(isInstalledGlobally.value
              ? await Promise.all(INCLUDE_GLOBAL.map(async dep => ({
                find: dep,
                replacement: fileURLToPath(await resolveClientDep(dep)),
              })))
              : []
            ),
          ],
          dedupe: ['vue'],
        },
        optimizeDeps: isInstalledGlobally.value
          ? {
              exclude: EXCLUDE_GLOBAL,
              include: INCLUDE_GLOBAL,
            }
          : {
            // We need to specify the full deps path for non-hoisted modules
              exclude: EXCLUDE_LOCAL,
              include: INCLUDE_LOCAL,
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
              options.clientRoot,
              // Special case for PNPM global installation
              isInstalledGlobally.value
                ? slash(options.cliRoot).replace(/\/\.pnpm\/.*$/ig, '')
                : options.cliRoot,
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

      if (isInstalledGlobally.value) {
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
    __MODE__: JSON.stringify(options.mode),
    __DEV__: options.mode === 'dev' ? 'true' : 'false',
    __SLIDEV_CLIENT_ROOT__: JSON.stringify(toAtFS(options.clientRoot)),
    __SLIDEV_HASH_ROUTE__: JSON.stringify(options.data.config.routerMode === 'hash'),
    __SLIDEV_HAS_SERVER__: options.mode !== 'build' ? 'true' : 'false',
  }
}
