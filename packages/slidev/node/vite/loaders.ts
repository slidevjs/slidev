import { basename, resolve } from 'node:path'
import type { Connect, HtmlTagDescriptor, ModuleNode, Plugin, Update, ViteDevServer } from 'vite'
import { isString, isTruthy, notNullish, range } from '@antfu/utils'
import fg from 'fast-glob'
import fs from 'fs-extra'
import Markdown from 'markdown-it'
import YAML from 'js-yaml'
import { bold, gray, red, yellow } from 'kolorist'

// @ts-expect-error missing types
import mila from 'markdown-it-link-attributes'
import type { ResolvedSlidevOptions, SlideInfo, SlidePatch, SlidevPluginOptions, SlidevServerOptions } from '@slidev/types'
import * as parser from '@slidev/parser/fs'
import equal from 'fast-deep-equal'

import type { LoadResult } from 'rollup'
import { stringifyMarkdownTokens } from '../utils'
import { toAtFS } from '../resolver'
import { templates } from '../virtual'
import type { VirtualModuleTempalteContext } from '../virtual/types'
import { templateTitleRendererMd } from '../virtual/titles'
import { VIRTUAL_SLIDE_PREFIX, templateSlides } from '../virtual/slides'
import { templateConfigs } from '../virtual/configs'

const regexId = /^\/\@slidev\/slide\/(\d+)\.(md|json)(?:\?import)?$/
const regexIdQuery = /(\d+?)\.(md|json|frontmatter)$/

const templateInjectionMarker = '/* @slidev-injection */'
const templateImportContextUtils = `import {
  useSlideContext,
  provideFrontmatter as _provideFrontmatter,
  frontmatterToProps as _frontmatterToProps,
} from "@slidev/client/context.ts"`.replace(/\n\s*/g, ' ')
const templateInitContext = `const { $slidev, $nav, $clicksContext, $clicks, $page, $renderContext, $frontmatter } = useSlideContext()`

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

const md = Markdown({ html: true })
md.use(mila, {
  attrs: {
    target: '_blank',
    rel: 'noopener',
  },
})

function renderNote(text: string = '') {
  let clickCount = 0
  const html = md.render(text
    // replace [click] marker with span
    .replace(/\[click(?::(\d+))?\]/gi, (_, count = 1) => {
      clickCount += Number(count)
      return `<span class="slidev-note-click-mark" data-clicks="${clickCount}"></span>`
    }),
  )

  return html
}

function withRenderedNote(data: SlideInfo): SlideInfo {
  return {
    ...data,
    noteHTML: renderNote(data?.note),
  }
}

export function createSlidesLoader(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
  serverOptions: SlidevServerOptions,
): Plugin[] {
  const hmrPages = new Set<number>()
  let server: ViteDevServer | undefined

  let _layouts_cache_time = 0
  let _layouts_cache: Record<string, string> = {}

  let skipHmr: { filePath: string, fileContent: string } | null = null

  const { data, clientRoot, roots, mode } = options

  const templateCtx: VirtualModuleTempalteContext = {
    md,
    async getLayouts() {
      const now = Date.now()
      if (now - _layouts_cache_time < 2000)
        return _layouts_cache

      const layouts: Record<string, string> = {}

      for (const root of [...roots, clientRoot]) {
        const layoutPaths = await fg('layouts/**/*.{vue,ts}', {
          cwd: root,
          absolute: true,
          suppressErrors: true,
        })

        for (const layoutPath of layoutPaths) {
          const layout = basename(layoutPath).replace(/\.\w+$/, '')
          if (layouts[layout])
            continue
          layouts[layout] = layoutPath
        }
      }

      _layouts_cache_time = now
      _layouts_cache = layouts

      return layouts
    },
  }

  return [
    {
      name: 'slidev:loader',
      configureServer(_server) {
        server = _server
        updateServerWatcher()

        server.middlewares.use(async (req, res, next) => {
          const match = req.url?.match(regexId)
          if (!match)
            return next()

          const [, no, type] = match
          const idx = Number.parseInt(no) - 1
          if (type === 'json' && req.method === 'GET') {
            res.write(JSON.stringify(withRenderedNote(data.slides[idx])))
            return res.end()
          }
          if (type === 'json' && req.method === 'POST') {
            const body: SlidePatch = await getBodyJson(req)
            const slide = data.slides[idx]

            if (body.content && body.content !== slide.source.content)
              hmrPages.add(idx)

            if (body.content)
              slide.content = slide.source.content = body.content
            if (body.note)
              slide.note = slide.source.note = body.note
            if (body.frontmatter) {
              Object.assign(slide.frontmatter, body.frontmatter)
              slide.source.frontmatterRaw = YAML.dump(slide.frontmatter)
            }

            parser.prettifySlide(slide.source)
            const fileContent = await parser.save(data.markdownFiles[slide.source.filepath])
            if (body.skipHmr) {
              skipHmr = {
                filePath: slide.source.filepath,
                fileContent,
              }
              server?.moduleGraph.invalidateModule(
                server.moduleGraph.getModuleById(`${VIRTUAL_SLIDE_PREFIX}${no}.md`)!,
              )
              if (body.frontmatter) {
                server?.moduleGraph.invalidateModule(
                  server.moduleGraph.getModuleById(`${VIRTUAL_SLIDE_PREFIX}${no}.frontmatter`)!,
                )
              }
            }

            res.statusCode = 200
            res.write(JSON.stringify(withRenderedNote(slide)))
            return res.end()
          }

          next()
        })

        server.middlewares.use(async (req, res, next) => {
          const match = req.url?.match(
            /^\/\@slidev\/resolve-id\/(.*)\?isRelative=(.*)$/,
          )
          if (!match)
            return next()

          const [, specifier, isRelative] = match

          const getResolved = async () => {
            if (isRelative === 'true') {
              const files = await fg([`**/${specifier}.*`], { cwd: `${options.userRoot}/snippets/` })
              return { id: files.length > 0 ? resolve(`${options.userRoot}/snippets/`, files[0]) : '' }
            }
            return await server!.pluginContainer.resolveId(specifier)
          }

          const resolved = await getResolved()
          res.statusCode = 200
          res.write(resolved?.id ?? '')
          return res.end()
        })
      },

      async handleHotUpdate(ctx) {
        if (!data.watchFiles.includes(ctx.file))
          return

        await ctx.read()

        const newData = await serverOptions.loadData?.()
        if (!newData)
          return []

        if (skipHmr && newData.markdownFiles[skipHmr.filePath]?.raw === skipHmr.fileContent) {
          skipHmr = null
          return []
        }

        const moduleIds = new Set<string>()

        if (data.slides.length !== newData.slides.length) {
          moduleIds.add(templateSlides.id)
          range(newData.slides.length).map(i => hmrPages.add(i))
        }

        if (!equal(data.headmatter.defaults, newData.headmatter.defaults)) {
          moduleIds.add(templateSlides.id)
          range(data.slides.length).map(i => hmrPages.add(i))
        }

        if (!equal(data.config, newData.config))
          moduleIds.add(templateConfigs.id)

        if (!equal(data.features, newData.features)) {
          setTimeout(() => {
            ctx.server.hot.send({ type: 'full-reload' })
          }, 1)
        }

        const length = Math.min(data.slides.length, newData.slides.length)

        for (let i = 0; i < length; i++) {
          const a = data.slides[i]
          const b = newData.slides[i]

          if (
            !hmrPages.has(i)
            && a.content.trim() === b.content.trim()
            && a.title?.trim() === b.title?.trim()
            && equal(a.frontmatter, b.frontmatter)
            && Object.entries(a.snippetsUsed ?? {}).every(([file, oldContent]) => {
              try {
                const newContent = fs.readFileSync(file, 'utf-8')
                return oldContent === newContent
              }
              catch {
                return false
              }
            })
          ) {
            if (a.note !== b.note) {
              ctx.server.hot.send(
                'slidev:update-note',
                {
                  no: i + 1,
                  note: b!.note || '',
                  noteHTML: renderNote(b!.note || ''),
                },
              )
            }
            continue
          }

          ctx.server.hot.send(
            'slidev:update-slide',
            {
              no: i + 1,
              data: withRenderedNote(newData.slides[i]),
            },
          )
          hmrPages.add(i)
        }

        Object.assign(data, newData)

        if (hmrPages.size > 0)
          moduleIds.add(templateTitleRendererMd.id)

        const vueModules = Array.from(hmrPages)
          .flatMap(i => [
            ctx.server.moduleGraph.getModuleById(`${VIRTUAL_SLIDE_PREFIX}${i + 1}.frontmatter`),
            ctx.server.moduleGraph.getModuleById(`${VIRTUAL_SLIDE_PREFIX}${i + 1}.md`),
          ])

        hmrPages.clear()

        const moduleEntries = [
          ...vueModules,
          ...Array.from(moduleIds).map(id => ctx.server.moduleGraph.getModuleById(id)),
        ]
          .filter(notNullish)
          .filter(i => !i.id?.startsWith('/@id/@vite-icons'))

        updateServerWatcher()

        return moduleEntries
      },

      resolveId(id) {
        if (id.startsWith(VIRTUAL_SLIDE_PREFIX) || id.startsWith('/@slidev/'))
          return id
        return null
      },

      async load(id): Promise<LoadResult> {
        const template = templates.find(i => i.id === id)
        if (template) {
          return {
            code: await template.getContent(options, templateCtx),
            map: { mappings: '' },
          }
        }

        // pages
        if (id.startsWith(VIRTUAL_SLIDE_PREFIX)) {
          const remaning = id.slice(VIRTUAL_SLIDE_PREFIX.length)
          const match = remaning.match(regexIdQuery)
          if (match) {
            const [, no, type] = match
            const pageNo = Number.parseInt(no) - 1
            const slide = data.slides[pageNo]
            if (!slide)
              return

            if (type === 'md') {
              return {
                code: slide?.content,
                map: { mappings: '' },
              }
            }
            else if (type === 'frontmatter') {
              const slideBase = {
                ...withRenderedNote(slide),
                frontmatter: undefined,
                source: undefined,
                // remove raw content in build, optimize the bundle size
                ...(mode === 'build' ? { raw: '', content: '', note: '' } : {}),
              }
              const fontmatter = getFrontmatter(pageNo)

              return {
                code: [
                  '// @unocss-include',
                  'import { reactive, computed } from "vue"',
                  `export const frontmatter = reactive(${JSON.stringify(fontmatter)})`,
                  `export const meta = reactive({
                    layout: computed(() => frontmatter.layout),
                    transition: computed(() => frontmatter.transition),
                    class: computed(() => frontmatter.class),
                    clicks: computed(() => frontmatter.clicks),
                    name: computed(() => frontmatter.name),
                    preload: computed(() => frontmatter.preload),
                    slide: {
                      ...(${JSON.stringify(slideBase)}),
                      frontmatter,
                      filepath: ${JSON.stringify(slide.source.filepath)},
                      start: ${JSON.stringify(slide.source.start)},
                      id: ${pageNo},
                      no: ${no},
                    },
                    __clicksContext: null,
                    __preloaded: false,
                  })`,
                  'export default frontmatter',
                  // handle HMR, update frontmatter with update
                  'if (import.meta.hot) {',
                  '  import.meta.hot.accept(({ frontmatter: update }) => {',
                  '    if(!update) return',
                  '    Object.keys(frontmatter).forEach(key => {',
                  '      if (!(key in update)) delete frontmatter[key]',
                  '    })',
                  '    Object.assign(frontmatter, update)',
                  '  })',
                  '}',
                ].join('\n'),
                map: { mappings: '' },
              }
            }
          }
          return {
            code: '',
            map: { mappings: '' },
          }
        }
      },
    },
    {
      name: 'slidev:layout-transform:pre',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.startsWith(VIRTUAL_SLIDE_PREFIX))
          return
        const remaning = id.slice(VIRTUAL_SLIDE_PREFIX.length)
        const match = remaning.match(regexIdQuery)
        if (!match)
          return
        const [, no, type] = match
        if (type !== 'md')
          return

        const pageNo = Number.parseInt(no) - 1
        return transformMarkdown(code, pageNo)
      },
    },
    {
      name: 'slidev:context-transform:pre',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.endsWith('.vue') || id.includes('/@slidev/client/') || id.includes('/packages/client/'))
          return
        return transformVue(code)
      },
    },
    {
      name: 'slidev:slide-transform:post',
      enforce: 'post',
      transform(code, id) {
        if (!id.match(/\/@slidev\/slides\/\d+\.md($|\?)/))
          return
        // force reload slide component to ensure v-click resolves correctly
        const replaced = code.replace('if (_rerender_only)', 'if (false)')
        if (replaced !== code)
          return replaced
      },
    },
    {
      name: 'slidev:index-html-transform',
      transformIndexHtml() {
        const { info, author, keywords } = data.headmatter
        return [
          {
            tag: 'title',
            children: getTitle(),
          },
          info && {
            tag: 'meta',
            attrs: {
              name: 'description',
              content: info,
            },
          },
          author && {
            tag: 'meta',
            attrs: {
              name: 'author',
              content: author,
            },
          },
          keywords && {
            tag: 'meta',
            attrs: {
              name: 'keywords',
              content: Array.isArray(keywords) ? keywords.join(', ') : keywords,
            },
          },
        ].filter(isTruthy) as HtmlTagDescriptor[]
      },
    },
  ]

  function updateServerWatcher() {
    if (!server)
      return
    server.watcher.add(data.watchFiles)
  }

  function getFrontmatter(pageNo: number) {
    return {
      ...(data.headmatter?.defaults as object || {}),
      ...(data.slides[pageNo]?.frontmatter || {}),
    }
  }

  async function transformMarkdown(code: string, pageNo: number) {
    const layouts = await templateCtx.getLayouts()
    const frontmatter = getFrontmatter(pageNo)
    let layoutName = frontmatter?.layout || (pageNo === 0 ? 'cover' : 'default')
    if (!layouts[layoutName]) {
      console.error(red(`\nUnknown layout "${bold(layoutName)}".${yellow(' Available layouts are:')}`)
      + Object.keys(layouts).map((i, idx) => (idx % 3 === 0 ? '\n    ' : '') + gray(i.padEnd(15, ' '))).join('  '))
      console.error()
      layoutName = 'default'
    }

    delete frontmatter.title
    const imports = [
      `import InjectedLayout from "${toAtFS(layouts[layoutName])}"`,
      `import frontmatter from "${toAtFS(`${VIRTUAL_SLIDE_PREFIX + (pageNo + 1)}.frontmatter`)}"`,
      templateImportContextUtils,
      '_provideFrontmatter(frontmatter)',
      templateInitContext,
      templateInjectionMarker,
    ]

    code = code.replace(/(<script setup.*>)/g, `$1\n${imports.join('\n')}\n`)
    const injectA = code.indexOf('<template>') + '<template>'.length
    const injectB = code.lastIndexOf('</template>')
    let body = code.slice(injectA, injectB).trim()
    if (body.startsWith('<div>') && body.endsWith('</div>'))
      body = body.slice(5, -6)
    code = `${code.slice(0, injectA)}\n<InjectedLayout v-bind="_frontmatterToProps(frontmatter,${pageNo})">\n${body}\n</InjectedLayout>\n${code.slice(injectB)}`

    return code
  }

  function transformVue(code: string): string {
    if (code.includes(templateInjectionMarker) || code.includes('useSlideContext()'))
      return code // Assume that the context is already imported and used
    const imports = [
      templateImportContextUtils,
      templateInitContext,
      templateInjectionMarker,
    ]
    const matchScript = code.match(/<script((?!setup).)*(setup)?.*>/)
    if (matchScript && matchScript[2]) {
      // setup script
      return code.replace(/(<script.*>)/g, `$1\n${imports.join('\n')}\n`)
    }
    else if (matchScript && !matchScript[2]) {
      // not a setup script
      const matchExport = code.match(/export\s+default\s+{/)
      if (matchExport) {
        // script exports a component
        const exportIndex = (matchExport.index || 0) + matchExport[0].length
        let component = code.slice(exportIndex)
        component = component.slice(0, component.indexOf('</script>'))

        const scriptIndex = (matchScript.index || 0) + matchScript[0].length
        const provideImport = '\nimport { injectionSlidevContext } from "@slidev/client/constants.ts"\n'
        code = `${code.slice(0, scriptIndex)}${provideImport}${code.slice(scriptIndex)}`

        let injectIndex = exportIndex + provideImport.length
        let injectObject = '$slidev: { from: injectionSlidevContext },'
        const matchInject = component.match(/.*inject\s*:\s*([\[{])/)
        if (matchInject) {
          // component has a inject option
          injectIndex += (matchInject.index || 0) + matchInject[0].length
          if (matchInject[1] === '[') {
            // inject option in array
            let injects = component.slice((matchInject.index || 0) + matchInject[0].length)
            const injectEndIndex = injects.indexOf(']')
            injects = injects.slice(0, injectEndIndex)
            injectObject += injects.split(',').map(inject => `${inject}: {from: ${inject}}`).join(',')
            return `${code.slice(0, injectIndex - 1)}{\n${injectObject}\n}${code.slice(injectIndex + injectEndIndex + 1)}`
          }
          else {
            // inject option in object
            return `${code.slice(0, injectIndex)}\n${injectObject}\n${code.slice(injectIndex)}`
          }
        }
        // add inject option
        return `${code.slice(0, injectIndex)}\ninject: { ${injectObject} },\n${code.slice(injectIndex)}`
      }
    }
    // no setup script and not a vue component
    return `<script setup>\n${imports.join('\n')}\n</script>\n${code}`
  }

  function getTitle() {
    if (isString(data.config.title)) {
      const tokens = md.parseInline(data.config.title, {})
      return stringifyMarkdownTokens(tokens)
    }
    return data.config.title
  }
}
