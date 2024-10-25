import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin, UserConfig } from 'vite'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { slash, uniq } from '@antfu/utils'
import { createResolve } from 'mlly'
import { isInstalledGlobally, resolveImportPath, toAtFS } from '../resolver'

const INCLUDE_GLOBAL = [
  '@typescript/ata',
  'file-saver',
  'lz-string',
  'prettier',
  'recordrtc',
  'typescript',
  'yaml',
  'html-to-image',
]

const INCLUDE_LOCAL = INCLUDE_GLOBAL.map(i => `@slidev/cli > @slidev/client > ${i}`)

// @keep-sorted
const EXCLUDE_GLOBAL = [
  '@antfu/utils',
  '@shikijs/monaco',
  '@shikijs/vitepress-twoslash/client',
  '@slidev/client',
  '@slidev/client/constants',
  '@slidev/client/context',
  '@slidev/client/logic/dark',
  '@slidev/parser',
  '@slidev/parser/core',
  '@slidev/rough-notation',
  '@slidev/types',
  '@unhead/vue',
  '@unocss/reset',
  '@vueuse/core',
  '@vueuse/math',
  '@vueuse/motion',
  '@vueuse/shared',
  'drauu',
  'floating-vue',
  'fuse.js',
  'mermaid',
  'monaco-editor',
  'shiki-magic-move/vue',
  'shiki',
  'shiki/core',
  'vue-demi',
  'vue-router',
  'vue',
]

const EXCLUDE_LOCAL = EXCLUDE_GLOBAL

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
    async config() {
      const injection: UserConfig = {
        define: options.utils.define,
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
        css: {
          postcss: {
            plugins: [
              await import('postcss-nested').then(r => (r.default || r)()) as any,
            ],
          },
        },
        server: {
          fs: {
            strict: true,
            allow: uniq([
              options.userWorkspaceRoot,
              options.clientRoot,
              // Special case for PNPM global installation
              isInstalledGlobally.value
                ? slash(options.cliRoot).replace(/\/\.pnpm\/.*$/gi, '')
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

      return injection
    },
    configureServer(server) {
      // serve our index.html after vite history fallback
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (req.url!.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html')
            res.statusCode = 200
            res.end(options.utils.indexHtml)
            return
          }
          next()
        })
      }
    },
  }
}
