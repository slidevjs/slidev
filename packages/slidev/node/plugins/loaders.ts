import { basename, join } from 'node:path'
import type { Connect, ModuleNode, Plugin, Update, ViteDevServer } from 'vite'
import { isString, notNullish, objectMap, range, slash, uniq } from '@antfu/utils'
import fg from 'fast-glob'
import fs from 'fs-extra'
import Markdown from 'markdown-it'
import { bold, gray, red, yellow } from 'kolorist'

// @ts-expect-error missing types
import mila from 'markdown-it-link-attributes'
import type { SlideInfo, SlideInfoExtended, SlidevMarkdown } from '@slidev/types'
import * as parser from '@slidev/parser/fs'
import equal from 'fast-deep-equal'

import type { LoadResult } from 'rollup'
import type { ResolvedSlidevOptions, SlidevPluginOptions, SlidevServerOptions } from '../options'
import { resolveImportPath, stringifyMarkdownTokens, toAtFS } from '../utils'

const regexId = /^\/\@slidev\/slide\/(\d+)\.(md|json)(?:\?import)?$/
const regexIdQuery = /(\d+?)\.(md|json|frontmatter)$/

const vueContextImports = [
  'import { inject as _vueInject, provide as _vueProvide, toRef as _vueToRef } from "vue"',
  `import {
    injectionSlidevContext as _injectionSlidevContext, 
    injectionClicks as _injectionClicks,
    injectionCurrentPage as _injectionCurrentPage,
    injectionRenderContext as _injectionRenderContext,
    injectionFrontmatter as _injectionFrontmatter,
  } from "@slidev/client/constants.ts"`.replace(/\n\s+/g, '\n'),
  'const $slidev = _vueInject(_injectionSlidevContext)',
  'const $nav = _vueToRef($slidev, "nav")',
  'const $clicks = _vueInject(_injectionClicks)',
  'const $page = _vueInject(_injectionCurrentPage)',
  'const $renderContext = _vueInject(_injectionRenderContext)',
]

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

function prepareSlideInfo(data: SlideInfo): SlideInfoExtended {
  return {
    ...data,
    noteHTML: md.render(data?.note || ''),
  }
}

export function createSlidesLoader(
  { data, entry, clientRoot, themeRoots, addonRoots, userRoot, roots, remote, mode }: ResolvedSlidevOptions,
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
            res.write(JSON.stringify(prepareSlideInfo(data.slides[idx])))
            return res.end()
          }
          if (type === 'json' && req.method === 'POST') {
            const body = await getBodyJson(req)
            const slide = data.slides[idx]
            hmrPages.add(idx)

            if (slide.source) {
              Object.assign(slide.source, body)
              await parser.saveExternalSlide(slide.source)
            }
            else {
              Object.assign(slide, body)
              await parser.save(data, entry)
            }

            res.statusCode = 200
            res.write(JSON.stringify(prepareSlideInfo(slide)))
            return res.end()
          }

          next()
        })
      },

      async handleHotUpdate(ctx) {
        if (!data.entries!.some(i => slash(i) === ctx.file))
          return

        await ctx.read()

        const newData = await parser.load(entry, data.themeMeta)

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
            && a?.note === b?.note
            && equal(a.frontmatter, b.frontmatter)
          )
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

        serverOptions.onDataReload?.(newData, data)
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

        // title
        if (id === '/@slidev/titles.md') {
          return {
            code: data.slides
              .filter(({ frontmatter }) => !frontmatter?.disabled)
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
              return {
                code: [
                  '// @unocss-include',
                  'import { reactive, computed } from "vue"',
                  `export const frontmatter = reactive(${JSON.stringify(slide.frontmatter)})`,
                  `export const meta = reactive({
                    layout: computed(() => frontmatter.layout),
                    transition: computed(() => frontmatter.transition),
                    class: computed(() => frontmatter.class),
                    clicks: computed(() => frontmatter.clicks),
                    name: computed(() => frontmatter.name),
                    preload: computed(() => frontmatter.preload),
                    slide: {
                      ...(${JSON.stringify({
                        ...prepareSlideInfo(slide),
                        frontmatter: undefined,
                        // remove raw content in build, optimize the bundle size
                        ...(mode === 'build' ? { raw: '', content: '', note: '' } : {}),
                      })}),
                      frontmatter,
                      filepath: ${JSON.stringify(slide.source?.filepath || entry)},
                      id: ${pageNo},
                      no: ${no},
                    },
                    __clicksElements: [],
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
        return transformMarkdown(code, pageNo, data)
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
  ]

  function updateServerWatcher() {
    if (!server)
      return
    server.watcher.add(data.entries?.map(slash) || [])
  }

  async function transformMarkdown(code: string, pageNo: number, data: SlidevMarkdown) {
    const layouts = await getLayouts()
    const frontmatter = {
      ...(data.headmatter?.defaults as object || {}),
      ...(data.slides[pageNo]?.frontmatter || {}),
    }
    let layoutName = frontmatter?.layout || (pageNo === 0 ? 'cover' : 'default')
    if (!layouts[layoutName]) {
      console.error(red(`\nUnknown layout "${bold(layoutName)}".${yellow(' Available layouts are:')}`)
      + Object.keys(layouts).map((i, idx) => (idx % 3 === 0 ? '\n    ' : '') + gray(i.padEnd(15, ' '))).join('  '))
      console.error()
      layoutName = 'default'
    }

    delete frontmatter.title
    const imports = [
      ...vueContextImports,
      `import InjectedLayout from "${toAtFS(layouts[layoutName])}"`,
      `import frontmatter from "${toAtFS(`${slidePrefix + (pageNo + 1)}.frontmatter`)}"`,
      'const $frontmatter = frontmatter',
      '_vueProvide(_injectionFrontmatter, frontmatter)',
      // update frontmatter in router
      ';(() => {',
      '  const route = $slidev.nav.rawRoutes.find(i => i.path === String($page.value))',
      '  if (route?.meta?.slide?.frontmatter) {',
      '    Object.keys(route.meta.slide.frontmatter).forEach(key => {',
      '      if (!(key in $frontmatter)) delete route.meta.slide.frontmatter[key]',
      '    })',
      '    Object.assign(route.meta.slide.frontmatter, frontmatter)',
      '  }',
      '})();',
    ]

    code = code.replace(/(<script setup.*>)/g, `$1\n${imports.join('\n')}\n`)
    const injectA = code.indexOf('<template>') + '<template>'.length
    const injectB = code.lastIndexOf('</template>')
    let body = code.slice(injectA, injectB).trim()
    if (body.startsWith('<div>') && body.endsWith('</div>'))
      body = body.slice(5, -6)
    code = `${code.slice(0, injectA)}\n<InjectedLayout v-bind="frontmatter">\n${body}\n</InjectedLayout>\n${code.slice(injectB)}`

    return code
  }

  function transformVue(code: string): string {
    if (code.includes('injectionSlidevContext') || code.includes('injectionClicks') || code.includes('const $slidev'))
      return code // Assume that the context is already imported and used
    const imports = [
      ...vueContextImports,
      'const $frontmatter = _vueInject(_injectionFrontmatter)',
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

    const roots = uniq([
      userRoot,
      ...themeRoots,
      ...addonRoots,
      clientRoot,
    ])

    for (const root of roots) {
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

  async function generateUserStyles() {
    const imports: string[] = [
      `import "${toAtFS(join(clientRoot, 'styles/vars.css'))}"`,
      `import "${toAtFS(join(clientRoot, 'styles/index.css'))}"`,
      `import "${toAtFS(join(clientRoot, 'styles/code.css'))}"`,
      `import "${toAtFS(join(clientRoot, 'styles/katex.css'))}"`,
      `import "${toAtFS(join(clientRoot, 'styles/transitions.css'))}"`,
    ]
    const roots = uniq([
      ...themeRoots,
      ...addonRoots,
      userRoot,
    ])

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
      imports.push(`import "${toAtFS(resolveImportPath('katex/dist/katex.min.css', true))}"`)

    if (data.config.highlighter === 'shiki') {
      imports.push(
        `import "${toAtFS(resolveImportPath('@shikijs/vitepress-twoslash/style.css', true))}"`,
        `import "${toAtFS(join(clientRoot, 'styles/shiki-twoslash.css'))}"`,
      )
    }

    if (data.config.css === 'unocss') {
      imports.unshift(
        'import "@unocss/reset/tailwind.css"',
        'import "uno:preflights.css"',
        'import "uno:typography.css"',
        'import "uno:shortcuts.css"',
      )
      imports.push('import "uno.css"')
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
    const redirects: string[] = []
    const layouts = await getLayouts()

    imports.push(`import __layout__end from '${layouts.end}'`)

    let no = 1
    const routes = data.slides
      .filter(({ frontmatter }) => !frontmatter?.disabled)
      .map((i, idx) => {
        imports.push(`import n${no} from '${slidePrefix}${idx + 1}.md'`)
        imports.push(`import { meta as f${no} } from '${slidePrefix}${idx + 1}.frontmatter'`)
        const route = `{ path: '${no}', name: 'page-${no}', component: n${no}, meta: f${no} }`

        if (i.frontmatter?.routeAlias)
          redirects.push(`{ path: '${i.frontmatter?.routeAlias}', redirect: { path: '${no}' } }`)

        no += 1

        return route
      })

    const routesStr = `export default [\n${routes.join(',\n')}\n]`
    const redirectsStr = `export const redirects = [\n${redirects.join(',\n')}\n]`

    return [...imports, routesStr, redirectsStr].join('\n')
  }

  function generateConfigs() {
    const config = { ...data.config, remote }
    if (isString(config.title)) {
      const tokens = md.parseInline(config.title, {})
      config.title = stringifyMarkdownTokens(tokens)
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
}
