import { basename } from 'path'
import { ModuleNode, Update, ViteDevServer, Plugin } from 'vite'
import { notNullish, objectMap } from '@antfu/utils'
import type { Connect } from 'vite'
import fg from 'fast-glob'
import * as parser from '../parser'
import { ResolvedSlidevOptions } from './options'

const regexId = /^\/\@slidev\/slide\/(\d+)\.(md|json)(?:\?import)?$/
const regexIdQuery = /id=(\d+?)\.(md|json)$/

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

export function createSlidesLoader({ entry, clientRoot, themeRoot, userRoot }: ResolvedSlidevOptions): Plugin[] {
  let data: parser.SlidesMarkdown
  let skipNext = false

  return [
    {
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
        if (id === '/@slidev/routes')
          return generateRoutes()

        // routes
        if (id === '/@slidev/layouts')
          return generateLayouts()

        // pages
        if (id.startsWith(entry)) {
          const remaning = id.slice(entry.length + 1)
          const match = remaning.match(regexIdQuery)
          if (match) {
            const [, no, type] = match
            const pageNo = parseInt(no)
            if (type === 'md')
              return data.slides[pageNo].raw
          }
          return ''
        }
      },
    },
    {
      name: 'slidev:layout-transform',
      enforce: 'post',
      async transform(code, id) {
        if (id.startsWith(entry)) {
          const remaning = id.slice(entry.length + 1)
          const match = remaning.match(regexIdQuery)
          if (!match)
            return

          const [, no, type] = match
          if (type !== 'md')
            return

          const layouts = await getLayouts()
          const pageNo = parseInt(no)
          const layoutName = data.slides[pageNo].frontmatter?.layout || 'default'
          if (!layouts[layoutName])
            throw new Error(`Unknown layout "${layoutName}"`)

          code = code.replace('export default _sfc_main', '')
          code = `import __layout from "${layouts[layoutName]}"\n${code}`
          code += `\nexport default {
            name: "layout-${layoutName}",
            render: () => _createBlock(__layout, null, { default: () => [_createVNode(_sfc_main)], _: 1 }),
            __file: __layout.__file,
          }`

          return code
        }
      },
    },

  ]

  async function getLayouts() {
    const layouts: Record<string, string> = {}

    const roots = [
      userRoot,
      themeRoot,
      clientRoot,
    ]

    for (const root of roots) {
      const layoutPaths = await fg('layouts/*.{vue,ts}', {
        cwd: root,
        absolute: true,
      })

      for (const layoutPath of layoutPaths) {
        const layout = basename(layoutPath).replace(/\.\w+$/, '')
        if (layouts[layout])
          continue
        layouts[layout] = layoutPath
      }
    }

    return layouts
  }

  async function generateLayouts() {
    const imports: string[] = []
    const layouts = objectMap(
      await getLayouts(),
      (k, v) => {
        imports.push(`import __layout_${k} from "/@fs${v}"`)
        return [k, `__layout_${k}`]
      },
    )

    return [
      imports.join('\n'),
      `export default {\n${Object.entries(layouts).map(([k, v]) => `"${k}": ${v}`).join(',\n')}\n}`,
    ].join('\n\n')
  }

  async function generateRoutes() {
    const imports: string[] = []
    const layouts = await getLayouts()

    imports.push(`import __layout__end from '${layouts.end}'`)

    let no = 0
    const routes = [
      '{ path: "", redirect: { path: "/0" } }',
      ...data.slides
        .map((i, idx) => {
          if (i.frontmatter?.disabled)
            return undefined
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
          const meta = Object.assign({}, i.frontmatter, additions)
          const route = `{ path: '${no}', name: 'page-${no}', component: n${no}, meta: ${JSON.stringify(meta)} }`
          no += 1
          return route
        })
        .filter(notNullish),
      `{ path: "${no}", component: __layout__end, meta: { layout: "end" } }`,
    ]

    const routesStr = `export default [\n${routes.join(',\n')}\n]`

    return [...imports, routesStr].join('\n')
  }
}
