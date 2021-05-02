import { basename } from 'path'
import { ModuleNode, Update, ViteDevServer, Plugin } from 'vite'
import { isTruthy, notNullish, objectMap } from '@antfu/utils'
import type { Connect } from 'vite'
import fg from 'fast-glob'
import Markdown from 'markdown-it'
// @ts-expect-error
import mila from 'markdown-it-link-attributes'
import { SlideInfo, SlideInfoExtended } from '@slidev/types'
import * as parser from '@slidev/parser'
import { ResolvedSlidevOptions, SlidevPluginOptions } from '../options'

const regexId = /^\/\@slidev\/slide\/(\d+)\.(md|json)(?:\?import)?$/
const regexIdQuery = /(\d+?)\.(md|json)$/

export function getBodyJson(req: Connect.IncomingMessage) {
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
      path: m.file!,
      timestamp,
      type: 'js-update',
    })),
  })
}

const md = Markdown()
md.use(mila, {
  attrs: {
    target: '_blank',
    rel: 'noopener',
  },
})

function prepareSlideInfo(data: SlideInfo): SlideInfoExtended {
  return {
    ...data,
    notesHTML: md.render(data.note || ''),
  }
}

export function createSlidesLoader({ data, entry, clientRoot, themeRoots, userRoot }: ResolvedSlidevOptions, pluginOptions: SlidevPluginOptions): Plugin[] {
  const slidePrefix = '/@slidev/slides/'
  const hmrNextModuleIds: string[] = []

  return [
    {
      name: 'slidev:loader',

      configureServer(server) {
        server.watcher.add(entry)

        server.middlewares.use(async(req, res, next) => {
          const match = req.url?.match(regexId)
          if (!match)
            return next()

          const [, no, type] = match
          const idx = parseInt(no)
          if (type === 'json' && req.method === 'GET') {
            res.write(JSON.stringify(prepareSlideInfo(data.slides[idx])))
            return res.end()
          }
          if (type === 'json' && req.method === 'POST') {
            const body = await getBodyJson(req)
            Object.assign(data.slides[idx], body)

            hmrNextModuleIds.push(`${slidePrefix}${idx}.md`)

            if (body.content != null)
              hmrNextModuleIds.push(`${slidePrefix}${idx}.md`)

            server.ws.send({
              type: 'custom',
              event: 'slidev-update',
              data: {
                id: idx,
                data: prepareSlideInfo(data.slides[idx]),
              },
            })

            await parser.save(data, entry)

            res.statusCode = 200
            return res.end()
          }

          next()
        })
      },

      async handleHotUpdate(ctx) {
        if (ctx.file !== entry)
          return

        const newData = await parser.load(entry)

        const moduleIds: (string | false)[] = [
          ...hmrNextModuleIds,
        ]

        hmrNextModuleIds.length = 0

        if (data.slides.length !== newData.slides.length)
          moduleIds.push('/@slidev/routes')

        if (JSON.stringify(data.config) !== JSON.stringify(newData.config))
          moduleIds.push('/@slidev/configs')

        const length = Math.max(data.slides.length, newData.slides.length)

        for (let i = 0; i < length; i++) {
          const a = data.slides[i]
          const b = newData.slides[i]

          if (a?.content.trim() === b?.content.trim() && JSON.stringify(a.frontmatter) === JSON.stringify(b.frontmatter))
            continue

          moduleIds.push(
            `${slidePrefix}${i}.md`,
            `${slidePrefix}${i}.json`,
          )
        }

        const moduleEntries = moduleIds
          .filter(isTruthy)
          .map(id => ctx.server.moduleGraph.getModuleById(id as string))
          .filter(notNullish)

        pluginOptions.onDataReload?.(newData, data)

        data = newData

        moduleEntries.map(m => ctx.server.moduleGraph.invalidateModule(m))
        return moduleEntries
      },

      resolveId(id) {
        if (id.startsWith(slidePrefix) || id.startsWith('/@slidev/'))
          return id
        return null
      },

      load(id) {
        // routes
        if (id === '/@slidev/routes')
          return generateRoutes()

        // layouts
        if (id === '/@slidev/layouts')
          return generateLayouts()

        // configs
        if (id === '/@slidev/configs')
          return `export default ${JSON.stringify(data.config)}`

        // pages
        if (id.startsWith(slidePrefix)) {
          const remaning = id.slice(slidePrefix.length)
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
      name: 'slidev:layout-transform:pre',
      enforce: 'pre',
      async transform(code, id) {
        if (id.startsWith(slidePrefix)) {
          const remaning = id.slice(slidePrefix.length)
          const match = remaning.match(regexIdQuery)
          if (!match)
            return

          const [, no, type] = match
          if (type !== 'md')
            return

          const pageNo = parseInt(no)
          const layouts = await getLayouts()
          const layoutName = data.slides[pageNo].frontmatter?.layout || (pageNo === 0 ? 'cover' : 'default')
          if (!layouts[layoutName])
            throw new Error(`Unknown layout "${layoutName}"`)

          const imports = [
            `import InjectedLayout from "/@fs${layouts[layoutName]}"`,
            `import { next, nextSlide, prev, prevSlide } from "/@fs${clientRoot}/logic/nav"`,
          ]

          code = code.replace(/(<script setup.*>)/g, `$1${imports.join('\n')}\n`)
          code = code.replace(/<template>([\s\S]*?)<\/template>/mg, '<template><InjectedLayout v-bind="frontmatter">$1</InjectedLayout></template>')
          return code
        }
      },
    },
  ]

  async function getLayouts() {
    const layouts: Record<string, string> = {}

    const roots = [
      userRoot,
      ...themeRoots,
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
      ...data.slides
        .map((i, idx) => {
          if (i.frontmatter?.disabled)
            return undefined
          imports.push(`import n${no} from '${slidePrefix}${idx}.md'`)
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
