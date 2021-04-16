import { resolve } from 'path'
import { promises as fs } from 'fs'
import { Plugin } from 'vite'
import { notNullish } from '@antfu/utils'
import matter from 'gray-matter'
import { SlidesMarkdownInfo, parseSlidesMarkdown } from '../parser'

let filepath = resolve(__dirname, '../slides.md')

async function read() {
  return await fs.readFile(filepath, 'utf-8')
}

export function createSlidesLoader(): Plugin {
  let raw: string | undefined
  let items: SlidesMarkdownInfo[] = []

  return {
    name: 'vite-slides:loader',

    async configResolved(_config) {
      filepath = resolve(_config.root, 'slides.md')
      raw = await read()
      items = parseSlidesMarkdown(raw)
    },

    configureServer(server) {
      server.watcher.add(filepath)
    },

    async handleHotUpdate(ctx) {
      if (ctx.file === filepath) {
        raw = await read()
        items = parseSlidesMarkdown(raw)

        const moduleEntries = [
          '/@vite-slides/routes',
          ...items.map((i, idx) => `/@vite-slides/slide/${idx}.md`),
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
        return items[pageNo].content
      }
      else if (id === '/@vite-slides/routes') {
        const imports: string[] = []

        const routes = `export default [\n${
          items
            .map((i, idx) => {
              imports.push(`import n${idx} from '/@vite-slides/slide/${idx}.md'`)
              const { data: meta } = matter(i.content)
              const additions = {
                slide: {
                  start: i.start,
                  end: i.end,
                  note: i.note,
                  file: filepath,
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
