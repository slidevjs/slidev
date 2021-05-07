import { basename } from 'path'
import { ModuleNode, Update, ViteDevServer, Plugin } from 'vite'
import { isString, isTruthy, notNullish, objectMap, slash } from '@antfu/utils'
import type { Connect } from 'vite'
import fg from 'fast-glob'
import Markdown from 'markdown-it'
// @ts-expect-error
import mila from 'markdown-it-link-attributes'
import { SlideInfo, SlideInfoExtended } from '@slidev/types'
import * as parser from '@slidev/parser/fs'
import equal from 'fast-deep-equal'
import { ResolvedSlidevOptions, SlidevPluginOptions } from '../options'
import { toAtFS } from '../utils'

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

export function createSlidesLoader(
  { data, entry, clientRoot, themeRoots, userRoot }: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
  VuePlugin: Plugin,
  MarkdownPlugin: Plugin,
): Plugin[] {
  const slidePrefix = '/@slidev/slides/'
  const hmrPages = new Set<number>()

  const entryId = slash(entry)

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

            hmrPages.add(idx)

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
        if (ctx.file !== entryId)
          return

        const newData = await parser.load(entry)

        const moduleIds: string[] = []

        if (data.slides.length !== newData.slides.length)
          moduleIds.push('/@slidev/routes')

        if (!equal(data.config, newData.config))
          moduleIds.push('/@slidev/configs')

        if (!equal(data.features, newData.features)) {
          setTimeout(() => {
            ctx.server.ws.send({ type: 'full-reload' })
          }, 1)
        }

        const length = Math.max(data.slides.length, newData.slides.length)

        for (let i = 0; i < length; i++) {
          if (hmrPages.has(i))
            continue

          const a = data.slides[i]
          const b = newData.slides[i]
          if (a?.content.trim() === b?.content.trim() && JSON.stringify(a.frontmatter) === JSON.stringify(b.frontmatter))
            continue
          hmrPages.add(i)
        }

        const modules = (
          await Promise.all(
            Array.from(hmrPages)
              .map(async(i) => {
                const id = `${slidePrefix}${i + 1}.md`
                const module = ctx.server.moduleGraph.getModuleById(id)

                return await VuePlugin.handleHotUpdate!({
                  ...ctx,
                  modules: Array.from(module?.importedModules || []),
                  file: id,
                  read: () => (<any>MarkdownPlugin.transform)(newData.slides[i]?.raw, id),
                },
                )
              }),
          )
        ).flatMap(i => i || [])

        hmrPages.clear()

        const moduleEntries = moduleIds
          .filter(isTruthy)
          .map(id => ctx.server.moduleGraph.getModuleById(id))
          .filter(notNullish)
          .concat(modules)

        pluginOptions.onDataReload?.(newData, data)
        Object.assign(data, newData)

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
          return generateConfigs()

        // pages
        if (id.startsWith(slidePrefix)) {
          const remaning = id.slice(slidePrefix.length)
          const match = remaning.match(regexIdQuery)
          if (match) {
            const [, no, type] = match
            const pageNo = parseInt(no) - 1
            if (type === 'md')
              return data.slides[pageNo]?.raw
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

          const pageNo = parseInt(no) - 1
          const layouts = await getLayouts()
          const layoutName = data.slides[pageNo]?.frontmatter?.layout || (pageNo === 0 ? 'cover' : 'default')
          if (!layouts[layoutName])
            throw new Error(`Unknown layout "${layoutName}"`)

          const imports = [
            `import InjectedLayout from "${toAtFS(layouts[layoutName])}"`,
            `import { next, nextSlide, prev, prevSlide } from "${toAtFS(clientRoot)}/logic/nav"`,
          ]

          code = code.replace(/(<script setup.*>)/g, `$1${imports.join('\n')}\n`)
          code = code.replace(/<template>([\s\S]*?)<\/template>/mg, '<template><InjectedLayout v-bind="frontmatter">$1</InjectedLayout></template>')
          return code
        }
      },
    },
    {
      name: 'xxx',
      handleHotUpdate(i) {
        if (i.file.endsWith('.vue'))
          console.dir(i.modules)
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
        imports.push(`import __layout_${k} from "${toAtFS(v)}"`)
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

    let no = 1
    const routes = [
      ...data.slides
        .map((i, idx) => {
          if (i.frontmatter?.disabled)
            return undefined
          imports.push(`import n${no} from '${slidePrefix}${idx + 1}.md'`)
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

  function generateConfigs() {
    const config = { ...data.config }
    if (isString(config.info))
      config.info = md.render(config.info)

    return `export default ${JSON.stringify(config)}`
  }
}
