import { Plugin } from 'vite'
import { notNullish } from '@antfu/utils'
import matter from 'gray-matter'
import * as parser from '../parser'
import { ResolvedViteSlidesOptions } from './options'

export function createSlidesLoader({ entry }: ResolvedViteSlidesOptions): Plugin {
  let data: parser.SlidesMarkdown

  return {
    name: 'vite-slides:loader',

    async configResolved() {
      data = await parser.load(entry)
    },

    configureServer(server) {
      server.watcher.add(entry)
    },

    async handleHotUpdate(ctx) {
      if (ctx.file === entry) {
        data = await parser.load(entry)

        const moduleEntries = [
          '/@vite-slides/routes',
          ...data.slides.map((i, idx) => `/@vite-slides/slide/${idx}.md`),
        ]
          .map(id => ctx.server.moduleGraph.getModuleById(id))
          .filter(notNullish)

        moduleEntries.map(m => ctx.server.moduleGraph.invalidateModule(m))
        return moduleEntries
      }
    },

    resolveId(id) {
      if (id.startsWith('/@vite-slides/'))
        return id
      return null
    },

    load(id) {
      const match = id.match(/^\/\@vite-slides\/slide\/(\d+).md$/)
      if (match) {
        const pageNo = parseInt(match[1])
        return data.slides[pageNo].content
      }
      else if (id === '/@vite-slides/routes') {
        const imports: string[] = []

        const routes = `export default [\n${
          data.slides
            .map((i, idx) => {
              imports.push(`import n${idx} from '/@vite-slides/slide/${idx}.md'`)
              const { data: meta } = matter(i.content)
              const additions = {
                slide: {
                  start: i.start,
                  end: i.end,
                  note: i.note,
                  file: entry,
                },
              }
              return `{ path: '/${idx}', name: 'page-${idx}', component: n${idx}, meta: ${JSON.stringify(Object.assign(meta, additions))} },\n`
            })
            .join('')
        }]`

        return [...imports, routes].join('\n')
      }
    },
  }
}
