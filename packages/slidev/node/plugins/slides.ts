import { ModuleNode, Plugin, Update, ViteDevServer } from 'vite'
import { notNullish } from '@antfu/utils'
import type { Connect } from 'vite'
import * as parser from '../parser'
import { ResolvedSlidevOptions } from './options'

const regexId = /^\/\@slidev\/slide\/(\d+)\.(md|json)(?:\?import)?$/

function getBodyJson(req: Connect.IncomingMessage) {
  return new Promise<any>((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('error', reject)
    req.on('end', () => {
      try {
        resolve(JSON.parse(body) || {})
      }
      catch (e) {
        reject(e)
      }
    })
  })
}

export function sendHmrReload(server: ViteDevServer, modules: ModuleNode[]) {
  const timestamp = +Date.now()

  modules.forEach(m => server.moduleGraph.invalidateModule(m))

  server.ws.send({
    type: 'update',
    updates: modules.map<Update>(m => ({
      acceptedPath: m.id || m.file!,
      path: m.id || m.file!,
      timestamp,
      type: 'js-update',
    })),
  })
}

export function createSlidesLoader({ entry }: ResolvedSlidevOptions): Plugin {
  let data: parser.SlidesMarkdown
  let skipNext = false

  return {
    name: 'slidev:loader',

    async configResolved() {
      data = await parser.load(entry)
    },

    configureServer(server) {
      server.watcher.add(entry)

      server.middlewares.use(async(req, res, next) => {
        const match = req.url?.match(regexId)
        if (!match)
          return next()

        const [, no, type] = match
        const idx = parseInt(no)
        if (type === 'json' && req.method === 'GET') {
          res.write(JSON.stringify(data.slides[idx]))
          return res.end()
        }
        if (type === 'json' && req.method === 'POST') {
          const body = await getBodyJson(req)
          // console.log(req.url, body)
          Object.assign(data.slides[idx], body)
          skipNext = true
          await parser.save(data, entry)

          sendHmrReload(
            server,
            [
              `${entry}?id=${idx}.md`,
              `${entry}?id=${idx}.json`,
            ]
              .map(id => server.moduleGraph.getModuleById(id))
              .filter(notNullish),
          )

          res.statusCode = 200
          return res.end()
        }

        // console.log(`Hello from ${req.url} ${req.method}`)

        next()
      })
    },

    async handleHotUpdate(ctx) {
      if (ctx.file === entry) {
        if (skipNext) {
          skipNext = false
          return
        }
        data = await parser.load(entry)

        const moduleEntries = [
          '/@slidev/routes',
          ...data.slides.map((i, idx) => `${entry}?id=${idx}.md`),
          ...data.slides.map((i, idx) => `${entry}?id=${idx}.json`),
        ]
          .map(id => ctx.server.moduleGraph.getModuleById(id))
          .filter(notNullish)

        moduleEntries.map(m => ctx.server.moduleGraph.invalidateModule(m))
        return moduleEntries
      }
    },

    resolveId(id) {
      if (id.startsWith(entry) || id.startsWith('/@slidev/'))
        return id
      return null
    },

    load(id) {
      // routes
      if (id === '/@slidev/routes') {
        const imports: string[] = []

        let no = 0
        const routes = `export default [\n${
          data.slides
            .map((i, idx) => {
              if (i.frontmatter?.disabled)
                return ''
              imports.push(`import n${no} from '${entry}?id=${idx}.md'`)
              const additions = {
                slide: {
                  start: i.start,
                  end: i.end,
                  note: i.note,
                  file: entry,
                  id: idx,
                  no,
                },
              }
              const route = `{ path: '/${no}', name: 'page-${no}', component: n${no}, meta: ${JSON.stringify(Object.assign({}, i.frontmatter, additions))} },\n`
              no += 1
              return route
            })
            .join('')
        }]`

        return [...imports, routes].join('\n')
      }

      // pages
      if (id.startsWith(entry)) {
        const remaning = id.slice(entry.length + 1)
        const match = remaning.match(/id=(\d+?)\.(md|json)$/)
        if (match) {
          const [, no, type] = match
          const pageNo = parseInt(no)
          if (type === 'md')
            return data.slides[pageNo].raw
        }
        return ''
      }
    },
  }
}
