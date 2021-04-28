import { mergeConfig, Plugin } from 'vite'
import { getIndexHtml } from '../common'
import { dependencies } from '../../../client/package.json'
import { getClientRoot, ResolvedSlidevOptions } from './options'

const EXCLUDE = [
  'theme-vitesse',
  '@slidev/types',
]

export function createConfigPlugin(options: ResolvedSlidevOptions): Plugin {
  return {
    name: 'slidev:config',
    config(config) {
      return mergeConfig(config, {
        resolve: {
          alias: {
            '@slidev/client/': `${getClientRoot()}/`,
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
      })
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
