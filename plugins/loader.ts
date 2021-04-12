import { resolve } from 'path'
import { Plugin } from 'vite'
import fs from 'fs-extra'
import { isNotNull } from '@antfu/utils'
import matter from 'gray-matter'

const filepath = resolve(__dirname, '../slides.md')

async function read() {
  return await fs.readFile(resolve(__dirname, '../slides.md'), 'utf-8')
}

function parse(raw: string) {
  const lines = raw.split(/\n/g)
  const pages: string[] = []
  let start = 0
  let dividers = 0

  lines.forEach((line, i) => {
    if (line === '---')
      dividers += 1

    if (dividers === 3) {
      pages.push(lines.slice(start, i).join('\n'))
      dividers = 1
      start = i
    }
  })

  if (start !== lines.length - 1)
    pages.push(lines.slice(start).join('\n'))

  return pages
}

export function createSlidesLoader(): Plugin {
  let raw: string | undefined
  let items: string[] = []

  return {
    name: 'slides-loader',

    async configResolved() {
      raw = await read()
      items = parse(raw)
    },

    async handleHotUpdate(ctx) {
      if (ctx.file === filepath) {
        raw = await ctx.read()
        items = parse(raw)

        return items
          .map((i, idx) => ctx.server.moduleGraph.getModuleById(`/@vite-slides/slides/${idx}.md`))
          .filter(isNotNull)
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
        return items[pageNo]
      }
      else if (id === '/@vite-slides/routes') {
        const imports: string[] = []

        const routes = `export default [\n${
          items
            .map((i, idx) => {
              imports.push(`import n${idx} from '/@vite-slides/slide/${idx}.md'`)
              const { data: meta } = matter(i)
              return `{ path: '/${idx}', name: 'page-${idx}', component: n${idx}, meta: ${JSON.stringify(meta)} },\n`
            })
            .join('')
        }]`

        return [...imports, routes].join('\n')
      }
    },
  }
}
