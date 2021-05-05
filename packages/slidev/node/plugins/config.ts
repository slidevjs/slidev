import { InlineConfig, mergeConfig, Plugin } from 'vite'
import { getIndexHtml } from '../common'
import { dependencies } from '../../../client/package.json'
import { ResolvedSlidevOptions } from '../options'
import { toAtFS } from '../utils'

const EXCLUDE = [
  '@slidev/types',
]

export function createConfigPlugin(options: ResolvedSlidevOptions): Plugin {
  return {
    name: 'slidev:config',
    config(config) {
      const injection: InlineConfig = {
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
          ],
          exclude: [
            'vue-demi',
          ],
        },

      }
      if (options.data.config.monaco) {
        // fix for monaco workers
        // https://github.com/vitejs/vite/issues/1927#issuecomment-805803918
        injection.build = {
          rollupOptions: {
            output: {
              manualChunks: {
                jsonWorker: ['monaco-editor/esm/vs/language/json/json.worker'],
                cssWorker: ['monaco-editor/esm/vs/language/css/css.worker'],
                htmlWorker: ['monaco-editor/esm/vs/language/html/html.worker'],
                tsWorker: ['monaco-editor/esm/vs/language/typescript/ts.worker'],
                editorWorker: ['monaco-editor/esm/vs/editor/editor.worker'],
              },
            },
          },
        }
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
