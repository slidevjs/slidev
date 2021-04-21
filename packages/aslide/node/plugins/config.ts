import { mergeConfig, Plugin } from 'vite'
import { getIndexHtml } from '../common'

export function createConfigPlugin(): Plugin {
  return {
    name: 'aslide:config',
    config(config) {
      return mergeConfig(config, {
        optimizeDeps: {
          include: [
            '@antfu/utils',
            '@vueuse/core',
            '@vueuse/head',
            'js-base64',
            'monaco-editor',
            'prettier',
            'prettier/esm/parser-babel',
            'prettier/esm/parser-html',
            'prettier/esm/parser-typescript',
            'vite-ssg',
            'vue-router',
            'vue',
          ],
          exclude: [
            '@iconify/json',
            '@vitejs/plugin-vue',
            '@vue/compiler-sfc',
            'markdown-it-prism',
            'minimist',
            'chalk',
            'fast-glob',
            'vite-plugin-components',
            'vite-plugin-icons',
            'vite-plugin-md',
            'vite-plugin-windicss',
            'vite',
            'vue-demi',
          ],
        },
      })
    },
    configureServer(server) {
      // serve our index.html after vite history fallback
      return () => {
        server.middlewares.use(async(req, res, next) => {
          if (req.url!.endsWith('.html')) {
            res.statusCode = 200
            res.end(await getIndexHtml())
            return
          }
          next()
        })
      }
    },
  }
}
