import type { ResolvedSlidevOptions, SlideInfo, SlidePatch, SlidevServerOptions } from '@slidev/types'
import type { LoadResult } from 'rollup'
import type { Plugin, ViteDevServer } from 'vite'
import { notNullish, range } from '@antfu/utils'
import * as parser from '@slidev/parser/fs'
import equal from 'fast-deep-equal'
import YAML from 'yaml'
import { sharedMd } from '../commands/shared'
import { createDataUtils } from '../options'
import { getBodyJson, updateFrontmatterPatch } from '../utils'
import { templates } from '../virtual'
import { templateConfigs } from '../virtual/configs'
import { templateMonacoRunDeps } from '../virtual/monaco-deps'
import { templateMonacoTypes } from '../virtual/monaco-types'
import { templateSlides } from '../virtual/slides'
import { templateTitleRendererMd } from '../virtual/titles'
import { regexSlideFacadeId, regexSlideReqPath, regexSlideSourceId } from './common'

function renderNote(text: string = '') {
  let clickCount = 0
  const html = sharedMd.render(text
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
  serverOptions: SlidevServerOptions,
): Plugin {
  const hmrSlidesIndexes = new Set<number>()
  let server: ViteDevServer | undefined

  let skipHmr: { filePath: string, fileContent: string } | null = null

  const { data, mode, utils } = options

  function getSourceId(index: number, type: 'md' | 'frontmatter') {
    return `${data.slides[index].source.filepath}__slidev_${index + 1}.${type}`
  }

  function updateServerWatcher() {
    if (!server)
      return
    server.watcher.add(Object.keys(data.watchFiles))
  }

  function getFrontmatter(pageNo: number) {
    return {
      ...(data.headmatter?.defaults as object || {}),
      ...(data.slides[pageNo]?.frontmatter || {}),
    }
  }

  return {
    name: 'slidev:loader',
    enforce: 'pre',

    configureServer(_server) {
      server = _server
      updateServerWatcher()

      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(regexSlideReqPath)
        if (!match)
          return next()

        const [, no] = match
        const idx = Number.parseInt(no) - 1
        if (req.method === 'GET') {
          res.write(JSON.stringify(withRenderedNote(data.slides[idx])))
          return res.end()
        }
        else if (req.method === 'POST') {
          const body: SlidePatch = await getBodyJson(req)
          const slide = data.slides[idx]

          if (body.content && body.content !== slide.source.content)
            hmrSlidesIndexes.add(idx)

          if (body.content)
            slide.content = slide.source.content = body.content
          if (body.frontmatterRaw != null) {
            if (body.frontmatterRaw.trim() === '') {
              slide.source.frontmatterDoc = slide.source.frontmatterStyle = undefined
            }
            else {
              const parsed = YAML.parseDocument(body.frontmatterRaw)
              if (parsed.errors.length)
                console.error('ERROR when saving frontmatter', parsed.errors)
              else
                slide.source.frontmatterDoc = parsed
            }
          }
          if (body.note)
            slide.note = slide.source.note = body.note
          if (body.frontmatter)
            updateFrontmatterPatch(slide, body.frontmatter)

          parser.prettifySlide(slide.source)
          const fileContent = await parser.save(data.markdownFiles[slide.source.filepath])
          if (body.skipHmr) {
            skipHmr = {
              filePath: slide.source.filepath,
              fileContent,
            }
            server?.moduleGraph.invalidateModule(
              server.moduleGraph.getModuleById(getSourceId(idx, 'md'))!,
            )
            if (body.frontmatter) {
              server?.moduleGraph.invalidateModule(
                server.moduleGraph.getModuleById(getSourceId(idx, 'frontmatter'))!,
              )
            }
          }

          res.statusCode = 200
          res.write(JSON.stringify(withRenderedNote(slide)))
          return res.end()
        }

        next()
      })
    },

    async handleHotUpdate(ctx) {
      const forceChangedSlides = data.watchFiles[ctx.file]
      if (!forceChangedSlides)
        return

      for (const index of forceChangedSlides) {
        hmrSlidesIndexes.add(index)
      }

      const newData = await serverOptions.loadData?.({
        [ctx.file]: await ctx.read(),
      })

      if (!newData)
        return []

      if (skipHmr && newData.markdownFiles[skipHmr.filePath]?.raw === skipHmr.fileContent) {
        skipHmr = null
        return []
      }

      const moduleIds = new Set<string>()

      if (data.slides.length !== newData.slides.length) {
        moduleIds.add(templateSlides.id)
        range(newData.slides.length).map(i => hmrSlidesIndexes.add(i))
      }

      if (!equal(data.headmatter.defaults, newData.headmatter.defaults)) {
        moduleIds.add(templateSlides.id)
        range(data.slides.length).map(i => hmrSlidesIndexes.add(i))
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
          !hmrSlidesIndexes.has(i)
          && a.content.trim() === b.content.trim()
          && a.title?.trim() === b.title?.trim()
          && equal(a.frontmatter, b.frontmatter)
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
        hmrSlidesIndexes.add(i)
      }

      Object.assign(data, newData)
      Object.assign(utils, createDataUtils(options))

      if (hmrSlidesIndexes.size > 0)
        moduleIds.add(templateTitleRendererMd.id)

      const vueModules = Array.from(hmrSlidesIndexes)
        .flatMap((idx) => {
          const frontmatter = ctx.server.moduleGraph.getModuleById(getSourceId(idx, 'frontmatter'))
          const main = ctx.server.moduleGraph.getModuleById(getSourceId(idx, 'md'))
          const styles = main ? [...main.clientImportedModules].find(m => m.id?.includes(`&type=style`)) : undefined
          return [
            frontmatter,
            main,
            styles,
          ]
        })

      hmrSlidesIndexes.clear()

      const moduleEntries = [
        ...ctx.modules.filter(i => i.id === templateMonacoRunDeps.id || i.id === templateMonacoTypes.id),
        ...vueModules,
        ...Array.from(moduleIds).map(id => ctx.server.moduleGraph.getModuleById(id)),
      ]
        .filter(notNullish)
        .filter(i => !i.id?.startsWith('/@id/@vite-icons'))

      updateServerWatcher()

      return moduleEntries
    },

    resolveId: {
      order: 'pre',
      handler(id) {
        if (id.startsWith('/@slidev/') || id.includes('__slidev_'))
          return id
        return null
      },
    },

    async load(id): Promise<LoadResult> {
      const template = templates.find(i => i.id === id)
      if (template) {
        return {
          code: await template.getContent.call(this, options),
          map: { mappings: '' },
        }
      }

      const matchFacade = id.match(regexSlideFacadeId)
      if (matchFacade) {
        const [, no, type] = matchFacade
        const idx = +no - 1
        const sourceId = JSON.stringify(getSourceId(idx, type as 'md' | 'frontmatter'))
        return [
          `export * from ${sourceId}`,
          `export { default } from ${sourceId}`,
        ].join('\n')
      }

      const matchSource = id.match(regexSlideSourceId)
      if (matchSource) {
        const [, no, type] = matchSource
        const idx = +no - 1
        const slide = data.slides[idx]
        if (!slide)
          return

        if (type === 'md') {
          return {
            code: slide.content,
            map: { mappings: '' },
          }
        }
        else if (type === 'frontmatter') {
          const slideBase = {
            ...withRenderedNote(slide),
            frontmatter: undefined,
            source: undefined,
            importChain: undefined,
            // remove raw content in build, optimize the bundle size
            ...(mode === 'build' ? { raw: '', content: '', note: '' } : {}),
          }
          const fontmatter = getFrontmatter(idx)

          return {
            code: [
              '// @unocss-include',
              'import { computed, reactive, shallowReactive } from "vue"',
              `export const frontmatterData = ${JSON.stringify(fontmatter)}`,
              // handle HMR, update frontmatter with update
              'if (import.meta.hot) {',
              '  const firstLoad = !import.meta.hot.data.frontmatter',
              '  import.meta.hot.data.frontmatter ??= reactive(frontmatterData)',
              '  import.meta.hot.accept(({ frontmatterData: update }) => {',
              '    if (firstLoad) return',
              '    const frontmatter = import.meta.hot.data.frontmatter',
              '    Object.keys(frontmatter).forEach(key => {',
              '      if (!(key in update)) delete frontmatter[key]',
              '    })',
              '    Object.assign(frontmatter, update)',
              '  })',
              '}',
              'export const frontmatter = import.meta.hot ? import.meta.hot.data.frontmatter : reactive(frontmatterData)',
              'export default frontmatter',
              'export const meta = shallowReactive({',
              '  get layout(){ return frontmatter.layout },',
              '  get transition(){ return frontmatter.transition },',
              '  get class(){ return frontmatter.class },',
              '  get clicks(){ return frontmatter.clicks },',
              '  get name(){ return frontmatter.name },',
              '  get preload(){ return frontmatter.preload },',
              // No need to be reactive, as it's only used once after reload
              '  slide: {',
              `    ...(${JSON.stringify(slideBase)}),`,
              `    frontmatter,`,
              `    filepath: ${JSON.stringify(mode === 'dev' ? slide.source.filepath : '')},`,
              `    start: ${JSON.stringify(slide.source.start)},`,
              `    id: ${idx},`,
              `    no: ${no},`,
              '  },',
              '  __clicksContext: null,',
              '  __preloaded: false,',
              '})',
            ].join('\n'),
            map: { mappings: '' },
          }
        }
      }

      // Entry files, shouldn't be processed by MarkdownIt
      if (data.markdownFiles[id])
        return ''
    },
  }
}
