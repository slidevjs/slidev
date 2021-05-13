import { InlineConfig, mergeConfig, Plugin } from 'vite'
import { getIndexHtml } from '../common'
import { dependencies } from '../../../client/package.json'
import { ResolvedSlidevOptions } from '../options'
import { toAtFS } from '../utils'

const EXCLUDE = [
  '@slidev/types',
  'mermaid',
]

export function createConfigPlugin(options: ResolvedSlidevOptions): Plugin {
  return {
    name: 'slidev:config',
    config(config) {
      const injection: InlineConfig = {
        define: {
          __SLIDEV_CLIENT_ROOT__: JSON.stringify(toAtFS(options.clientRoot)),
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
          exclude: [
            'vue-demi',
            'mermaid',
          ],
        },
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
