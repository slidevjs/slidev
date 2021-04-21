import { Plugin } from 'vite'
import { notNullish } from '@antfu/utils'
import type { Connect } from 'vite'
import * as parser from '../parser'
import { ResolvedAslideOptions } from './options'

const regexId = /^\/\@aslide\/slide\/(\d+)\.(md|json)(?:\?import)?$/

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

export function createSlidesLoader({ entry }: ResolvedAslideOptions): Plugin {
  let data: parser.SlidesMarkdown

  return {
    name: 'aslide:loader',

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
        if (type === 'json' && req.method === 'GET') {
          res.write(JSON.stringify(data.slides[parseInt(no)]))
          return res.end()
        }
        if (type === 'json' && req.method === 'POST') {
          const body = await getBodyJson(req)
          // console.log(req.url, body)
          Object.assign(data.slides[parseInt(no)], body)
          await parser.save(data, entry)
          res.statusCode = 200
          return res.end()
        }

        // console.log(`Hello from ${req.url} ${req.method}`)

        next()
      })
    },

    async handleHotUpdate(ctx) {
      if (ctx.file === entry) {
        data = await parser.load(entry)

        const moduleEntries = [
          '/@aslide/routes',
          ...data.slides.map((i, idx) => `/@aslide/slide/${idx}.md`),
          ...data.slides.map((i, idx) => `/@aslide/slide/${idx}.json`),
        ]
          .map(id => ctx.server.moduleGraph.getModuleById(id))
          .filter(notNullish)

        moduleEntries.map(m => ctx.server.moduleGraph.invalidateModule(m))
        return moduleEntries
      }
    },

    resolveId(id) {
      if (id.startsWith('/@aslide/'))
        return id
      return null
    },

    load(id) {
      const match = id.match(regexId)
      if (match) {
        const [, id, type] = match
        const pageNo = parseInt(id)
        if (type === 'md')
          return data.slides[pageNo].raw
      }
      else if (id === '/@aslide/routes') {
        const imports: string[] = []

        const routes = `export default [\n${
          data.slides
            .map((i, idx) => {
              if (i.frontmatter?.disabled)
                return ''
              imports.push(`import n${idx} from '/@aslide/slide/${idx}.md'`)
              const additions = {
                slide: {
                  start: i.start,
                  end: i.end,
                  note: i.note,
                  file: entry,
                },
              }
              return `{ path: '/${idx}', name: 'page-${idx}', component: n${idx}, meta: ${JSON.stringify(Object.assign({}, i.frontmatter, additions))} },\n`
            })
            .join('')
        }]`

        return [...imports, routes].join('\n')
      }
    },
  }
}
