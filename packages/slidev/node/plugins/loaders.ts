import { basename, join, resolve } from 'node:path'
import { builtinModules } from 'node:module'
import type { Connect, HtmlTagDescriptor, ModuleNode, Plugin, Update, ViteDevServer } from 'vite'
import { isString, isTruthy, notNullish, objectMap, range, uniq } from '@antfu/utils'
import fg from 'fast-glob'
import fs from 'fs-extra'
import Markdown from 'markdown-it'
import { bold, gray, red, yellow } from 'kolorist'

// @ts-expect-error missing types
import mila from 'markdown-it-link-attributes'
import type { SlideInfo, SlidePatch } from '@slidev/types'
import * as parser from '@slidev/parser/fs'
import equal from 'fast-deep-equal'

import type { LoadResult } from 'rollup'
import type { LanguageInput, LanguageRegistration, MaybeGetter, SpecialLanguage, ThemeInput, ThemeRegistration } from 'shiki'
import type { ResolvedSlidevOptions, SlidevPluginOptions, SlidevServerOptions } from '../options'
import { stringifyMarkdownTokens } from '../utils'
import { resolveImportPath, toAtFS } from '../resolver'
import { loadShikiSetups, scanMonacoModules } from './markdown'

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
  { data, clientRoot, roots, remote, mode, userRoot }: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
  serverOptions: SlidevServerOptions,
): Plugin[] {
  const slidePrefix = '/@slidev/slides/'
  const hmrPages = new Set<number>()
  let server: ViteDevServer | undefined

  let _layouts_cache_time = 0
  let _layouts_cache: Record<string, string> = {}

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
          const idx = Number.parseInt(no)
          if (type === 'json' && req.method === 'GET') {
            res.write(JSON.stringify(withRenderedNote(data.slides[idx])))
            return res.end()
          }
          if (type === 'json' && req.method === 'POST') {
            const body: SlidePatch = await getBodyJson(req)
            const slide = data.slides[idx]

            if (body.content && body.content !== slide.source.content)
              hmrPages.add(idx)

            Object.assign(slide.source, body)
            parser.prettifySlide(slide.source)
            await parser.save(data.markdownFiles[slide.source.filepath])

            res.statusCode = 200
            res.write(JSON.stringify(withRenderedNote(slide)))
            return res.end()
          }

          next()
        })
      },

      async handleHotUpdate(ctx) {
        if (!data.watchFiles.includes(ctx.file))
          return

        await ctx.read()

        const newData = await serverOptions.loadData?.()
        if (!newData)
          return []

        const moduleIds = new Set<string>()

        if (data.slides.length !== newData.slides.length) {
          moduleIds.add('/@slidev/routes')
          range(newData.slides.length).map(i => hmrPages.add(i))
        }

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
          const a = data.slides[i]
          const b = newData.slides[i]

          if (
            a?.content.trim() === b?.content.trim()
            && a?.title?.trim() === b?.title?.trim()
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
            if (a?.note !== b?.note) {
              ctx.server.ws.send({
                type: 'custom',
                event: 'slidev-update-note',
                data: {
                  id: i,
                  note: b!.note || '',
                  noteHTML: renderNote(b!.note || ''),
                },
              })
            }
            continue
          }

          ctx.server.ws.send({
            type: 'custom',
            event: 'slidev-update',
            data: {
              id: i,
              data: withRenderedNote(newData.slides[i]),
            },
          })
          hmrPages.add(i)
        }

        Object.assign(data, newData)

        if (hmrPages.size > 0)
          moduleIds.add('/@slidev/titles.md')

        const vueModules = Array.from(hmrPages)
          .flatMap(i => [
            ctx.server.moduleGraph.getModuleById(`${slidePrefix}${i + 1}.frontmatter`),
            ctx.server.moduleGraph.getModuleById(`${slidePrefix}${i + 1}.md`),
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
        if (id.startsWith(slidePrefix) || id.startsWith('/@slidev/'))
          return id
        return null
      },

      load(id): LoadResult | Promise<LoadResult> {
        // routes
        if (id === '/@slidev/routes')
          return generateRoutes()

        // layouts
        if (id === '/@slidev/layouts')
          return generateLayouts()

        // styles
        if (id === '/@slidev/styles')
          return generateUserStyles()

        // monaco-types
        if (id === '/@slidev/monaco-types')
          return generateMonacoTypes()

        // configs
        if (id === '/@slidev/configs')
          return generateConfigs()

        // global component
        if (id === '/@slidev/global-components/top')
          return generateGlobalComponents('top')

        // global component
        if (id === '/@slidev/global-components/bottom')
          return generateGlobalComponents('bottom')

        // custom nav controls
        if (id === '/@slidev/custom-nav-controls')
          return generateCustomNavControls()

        // shiki for client side
        if (id === '/@slidev/shiki')
          return generteShikiBundle()

        // title
        if (id === '/@slidev/titles.md') {
          return {
            code: data.slides
              .map(({ title }, i) => `<template ${i === 0 ? 'v-if' : 'v-else-if'}="+no === ${i + 1}">\n\n${title}\n\n</template>`)
              .join(''),
            map: { mappings: '' },
          }
        }

        // pages
        if (id.startsWith(slidePrefix)) {
          const remaning = id.slice(slidePrefix.length)
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
        if (!id.startsWith(slidePrefix))
          return
        const remaning = id.slice(slidePrefix.length)
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
      name: 'slidev:title-transform:pre',
      enforce: 'pre',
      transform(code, id) {
        if (id !== '/@slidev/titles.md')
          return
        return transformTitles(code)
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
    const layouts = await getLayouts()
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
      `import frontmatter from "${toAtFS(`${slidePrefix + (pageNo + 1)}.frontmatter`)}"`,
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

  function transformTitles(code: string) {
    return code
      .replace(/<template>\s*<div>\s*<p>/, '<template>')
      .replace(/<\/p>\s*<\/div>\s*<\/template>/, '</template>')
      .replace(/<script\ssetup>/, `<script setup lang="ts">
defineProps<{ no: number | string }>()`)
  }

  async function getLayouts() {
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
  }

  async function resolveUrl(id: string) {
    return toAtFS(await resolveImportPath(id, true))
  }

  function resolveUrlOfClient(name: string) {
    return toAtFS(join(clientRoot, name))
  }

  async function generateUserStyles() {
    const imports: string[] = [
      `import "${resolveUrlOfClient('styles/vars.css')}"`,
      `import "${resolveUrlOfClient('styles/index.css')}"`,
      `import "${resolveUrlOfClient('styles/code.css')}"`,
      `import "${resolveUrlOfClient('styles/katex.css')}"`,
      `import "${resolveUrlOfClient('styles/transitions.css')}"`,
      `import "${resolveUrlOfClient('styles/monaco.css')}"`,
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
        if (fs.existsSync(style)) {
          imports.push(`import "${toAtFS(style)}"`)
          continue
        }
      }
    }

    if (data.features.katex)
      imports.push(`import "${await resolveUrl('katex/dist/katex.min.css')}"`)

    if (data.config.highlighter === 'shiki') {
      imports.push(
        `import "${await resolveUrl('@shikijs/vitepress-twoslash/style.css')}"`,
        `import "${resolveUrlOfClient('styles/shiki-twoslash.css')}"`,
      )
    }

    if (data.config.css === 'unocss') {
      imports.unshift(
        `import "${await resolveUrl('@unocss/reset/tailwind.css')}"`,
        'import "uno:preflights.css"',
        'import "uno:typography.css"',
        'import "uno:shortcuts.css"',
      )
      imports.push('import "uno.css"')
    }

    return imports.join('\n')
  }

  async function generateMonacoTypes() {
    const typesRoot = join(userRoot, 'snippets')
    const files = await fg(['**/*.ts', '**/*.mts', '**/*.cts'], { cwd: typesRoot })
    let result = 'import { addFile } from "@slidev/client/setup/monaco.ts"\n'

    // User snippets
    for (const file of files) {
      const url = `${toAtFS(resolve(typesRoot, file))}?monaco-types&raw`
      result += `addFile(import(${JSON.stringify(url)}), ${JSON.stringify(file)})\n`
    }

    // Dependencies
    const deps = data.config.monacoTypesAdditionalPackages
    if (data.config.monacoTypesSource === 'local')
      deps.push(...scanMonacoModules(data.slides.map(s => s.source.raw).join()))

    // Copied from https://github.com/microsoft/TypeScript-Website/blob/v2/packages/ata/src/edgeCases.ts
    // Converts some of the known global imports to node so that we grab the right info
    function mapModuleNameToModule(moduleSpecifier: string) {
      if (moduleSpecifier.startsWith('node:'))
        return 'node'
      if (builtinModules.includes(moduleSpecifier))
        return 'node'
      const mainPackageName = moduleSpecifier.split('/')[0]
      if (builtinModules.includes(mainPackageName) && !mainPackageName.startsWith('@'))
        return 'node'

      // strip module filepath e.g. lodash/identity => lodash
      const [a = '', b = ''] = moduleSpecifier.split('/')
      const moduleName = a.startsWith('@') ? `${a}/${b}` : a

      return moduleName
    }

    for (const specifier of uniq(deps)) {
      if (specifier[0] === '.')
        continue
      const moduleName = mapModuleNameToModule(specifier)
      result += `import(${JSON.stringify(`/@slidev-monaco-types/resolve?pkg=${moduleName}`)})\n`
    }

    return result
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
    const redirects: string[] = []
    const layouts = await getLayouts()

    imports.push(
      `import { markRaw } from 'vue'`,
      `import __layout__end from '${layouts.end}'`,
    )

    let no = 1
    const routes = data.slides
      .map((i, idx) => {
        imports.push(`import n${no} from '${slidePrefix}${idx + 1}.md'`)
        imports.push(`import { meta as f${no} } from '${slidePrefix}${idx + 1}.frontmatter'`)
        const route = `{ path: '${no}', name: 'page-${no}', component: n${no}, meta: f${no} }`

        if (i.frontmatter?.routeAlias)
          redirects.push(`{ path: '${i.frontmatter?.routeAlias}', redirect: { path: '${no}' } }`)

        no += 1

        return route
      })

    const routesStr = `export const rawRoutes = [\n${routes.join(',\n')}\n].map(markRaw)`
    const redirectsStr = `export const redirects = [\n${redirects.join(',\n')}\n].map(markRaw)`

    return [...imports, routesStr, redirectsStr].join('\n')
  }

  function getTitle() {
    if (isString(data.config.title)) {
      const tokens = md.parseInline(data.config.title, {})
      return stringifyMarkdownTokens(tokens)
    }
    return data.config.title
  }

  function generateConfigs() {
    const config = {
      ...data.config,
      remote,
      title: getTitle(),
    }

    if (isString(config.info))
      config.info = md.render(config.info)

    return `export default ${JSON.stringify(config)}`
  }

  async function generateGlobalComponents(layer: 'top' | 'bottom') {
    const components = roots
      .flatMap((root) => {
        if (layer === 'top') {
          return [
            join(root, 'global.vue'),
            join(root, 'global-top.vue'),
            join(root, 'GlobalTop.vue'),
          ]
        }
        else {
          return [
            join(root, 'global-bottom.vue'),
            join(root, 'GlobalBottom.vue'),
          ]
        }
      })
      .filter(i => fs.existsSync(i))

    const imports = components.map((i, idx) => `import __n${idx} from '${toAtFS(i)}'`).join('\n')
    const render = components.map((i, idx) => `h(__n${idx})`).join(',')

    return `
${imports}
import { h } from 'vue'
export default {
  render() {
    return [${render}]
  }
}
`
  }

  async function generateCustomNavControls() {
    const components = roots
      .flatMap((root) => {
        return [
          join(root, 'custom-nav-controls.vue'),
          join(root, 'CustomNavControls.vue'),
        ]
      })
      .filter(i => fs.existsSync(i))

    const imports = components.map((i, idx) => `import __n${idx} from '${toAtFS(i)}'`).join('\n')
    const render = components.map((i, idx) => `h(__n${idx})`).join(',')

    return `
${imports}
import { h } from 'vue'
export default {
  render() {
    return [${render}]
  }
}
`
  }

  async function generteShikiBundle() {
    const options = await loadShikiSetups(clientRoot, roots)
    const langs = await resolveLangs(options.langs || ['javascript', 'typescript', 'html', 'css'])
    const resolvedThemeOptions = 'themes' in options
      ? {
          themes: Object.fromEntries(await Promise.all(Object.entries(options.themes)
            .map(async ([name, value]) => [name, await resolveTheme(value!)]),
          )) as Record<string, ThemeRegistration | string>,
        }
      : {
          theme: await resolveTheme(options.theme || 'vitesse-dark'),
        }

    const themes = resolvedThemeOptions.themes
      ? Object.values(resolvedThemeOptions.themes)
      : [resolvedThemeOptions.theme!]

    const themeOptionsNames = resolvedThemeOptions.themes
      ? { themes: Object.fromEntries(Object.entries(resolvedThemeOptions.themes).map(([name, value]) => [name, typeof value === 'string' ? value : value.name])) }
      : { theme: typeof resolvedThemeOptions.theme === 'string' ? resolvedThemeOptions.theme : resolvedThemeOptions.theme.name }

    async function normalizeGetter<T>(p: MaybeGetter<T>): Promise<T> {
      return Promise.resolve(typeof p === 'function' ? (p as any)() : p).then(r => r.default || r)
    }

    async function resolveLangs(langs: (LanguageInput | SpecialLanguage | string)[]): Promise<(LanguageRegistration | string)[]> {
      return Array.from(new Set((
        await Promise.all(
          langs.map(async lang => await normalizeGetter(lang as LanguageInput).then(r => Array.isArray(r) ? r : [r])),
        )).flat()))
    }

    async function resolveTheme(theme: string | ThemeInput): Promise<ThemeRegistration | string> {
      return typeof theme === 'string' ? theme : await normalizeGetter(theme)
    }

    const langsInit = await Promise.all(langs
      .map(async lang =>
        typeof lang === 'string'
          ? `import('${await resolveUrl(`shiki/langs/${lang}.mjs`)}')`
          : JSON.stringify(lang)),
    )

    const themesInit = await Promise.all(themes
      .map(async theme =>
        typeof theme === 'string'
          ? `import('${await resolveUrl(`shiki/themes/${theme}.mjs`)}')`
          : JSON.stringify(theme)))

    const langNames = langs
      .flatMap(lang => typeof lang === 'string' ? lang : lang.name)

    const lines: string[] = []
    lines.push(
      `import { getHighlighterCore } from "${await resolveUrl('shiki/core')}"`,
      `export { shikiToMonaco } from "${await resolveUrl('@shikijs/monaco')}"`,

      `export const languages = ${JSON.stringify(langNames)}`,
      `export const themes = ${JSON.stringify(themeOptionsNames.themes || themeOptionsNames.theme)}`,

      'export const shiki = getHighlighterCore({',
      `  themes: [${themesInit.join(',')}],`,
      `  langs: [${langsInit.join(',')}],`,
      `  loadWasm: import('${await resolveUrl('shiki/wasm')}'),`,
      '})',
    )

    return lines.join('\n')
  }
}
