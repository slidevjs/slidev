import { basename, join } from 'path'
import { ModuleNode, Update, ViteDevServer, Plugin } from 'vite'
import { isString, notNullish, objectMap, range, slash } from '@antfu/utils'
import type { Connect } from 'vite'
import fg from 'fast-glob'
import Markdown from 'markdown-it'
import { RouteMeta } from 'vue-router'
// @ts-expect-error
import mila from 'markdown-it-link-attributes'
import { SlideInfo, SlideInfoExtended, SlidevMarkdown } from '@slidev/types'
import * as parser from '@slidev/parser/fs'
import equal from 'fast-deep-equal'
import { existsSync } from 'fs-extra'
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

        const moduleIds = new Set<string>()

        if (data.slides.length !== newData.slides.length)
          moduleIds.add('/@slidev/routes')

        if (!equal(data.headmatter.defaults, newData.headmatter.defaults)) {
          moduleIds.add('/@slidev/routes')
          range(data.slides.length).map(i => hmrPages.add(i))
        }

        if (!equal(data.config, newData.config))
          moduleIds.add('/@slidev/configs')

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

          ctx.server.ws.send({
            type: 'custom',
            event: 'slidev-update',
            data: {
              id: i,
              data: prepareSlideInfo(newData.slides[i]),
            },
          })
          hmrPages.add(i)
        }

        pluginOptions.onDataReload?.(newData, data)
        Object.assign(data, newData)

        const vueModules = (
          await Promise.all(Array.from(hmrPages).map(async(i) => {
            const file = `${slidePrefix}${i + 1}.md`
            return await VuePlugin.handleHotUpdate!({
              ...ctx,
              modules: Array.from(ctx.server.moduleGraph.getModulesByFile(file) || []),
              file,
              async read() {
                return await transformMarkdown((<any>MarkdownPlugin.transform)(newData.slides[i]?.content, file), i, newData)
              },
            })
          }),
          )
        ).flatMap(i => i || [])
        hmrPages.clear()

        const moduleEntries = [
          ...vueModules,
          ...Array.from(moduleIds).map(id => ctx.server.moduleGraph.getModuleById(id)),
        ]
          .filter(notNullish)
          .filter(i => !i.id?.startsWith('/@id/@vite-icons'))

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

        // styles
        if (id === '/@slidev/styles')
          return generateUserStyles()

        // styles
        if (id === '/@slidev/monaco-types')
          return generateMonacoTypes()

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
              return data.slides[pageNo]?.content
          }
          return ''
        }
      },
    },
    {
      name: 'slidev:layout-transform:pre',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.startsWith(slidePrefix))
          return
        const remaning = id.slice(slidePrefix.length)
        const match = remaning.match(regexIdQuery)
        if (!match)
          return
        const [, no, type] = match
        if (type !== 'md')
          return

        const pageNo = parseInt(no) - 1
        return transformMarkdown(code, pageNo, data)
      },
    },
  ]

  async function transformMarkdown(code: string, pageNo: number, data: SlidevMarkdown) {
    const layouts = await getLayouts()
    const frontmatter = {
      ...(data.headmatter?.defaults as object || {}),
      ...(data.slides[pageNo]?.frontmatter || {}),
    }
    const layoutName = frontmatter?.layout || (pageNo === 0 ? 'cover' : 'default')
    if (!layouts[layoutName])
      throw new Error(`Unknown layout "${layoutName}"`)

    const imports = [
      `import InjectedLayout from "${toAtFS(layouts[layoutName])}"`,
      `const frontmatter = ${JSON.stringify(frontmatter)}`,
    ]

    code = code.replace(/(<script setup.*>)/g, `$1${imports.join('\n')}\n`)
    code = code.replace(/<template>([\s\S]*?)<\/template>/mg, '<template><InjectedLayout v-bind="frontmatter">$1</InjectedLayout></template>')
    return code
  }

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

  async function generateUserStyles() {
    const imports: string[] = [
      `import "${toAtFS(join(clientRoot, 'styles/index.css'))}"`,
      `import "${toAtFS(join(clientRoot, 'styles/code.css'))}"`,
    ]
    const roots = [
      ...themeRoots,
      userRoot,
    ]

    for (const root of roots) {
      const styles = [
        join(root, 'styles', 'index.ts'),
        join(root, 'styles', 'index.js'),
        join(root, 'styles', 'index.css'),
        join(root, 'styles.css'),
        join(root, 'style.css'),
      ]

      for (const style of styles) {
        if (existsSync(style)) {
          imports.push(`import "${toAtFS(style)}"`)
          continue
        }
      }
    }

    return imports.join('\n')
  }

  async function generateMonacoTypes() {
    return `void 0; ${parser.scanMonacoModules(data.raw).map(i => `import('/@slidev-monaco-types/${i}')`).join('\n')}`
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
          const additions: RouteMeta = {
            slide: {
              start: i.start,
              end: i.end,
              note: i.note,
              file: entry,
              id: idx,
              no,
            },
            __clicksElements: [],
            __preloaded: false,
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
