/**
 * Regression for https://github.com/slidevjs/slidev/issues/2241
 *
 * Snippet imports (`<<<`) register their files in `data.watchFiles` while a
 * slide is rendered. Every HMR reload replaces `data` with freshly parsed data,
 * so after the first reload edits to imported snippets must still update the
 * slides that import them.
 */
import type { ResolvedSlidevOptions } from '@slidev/types'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createServer, parser, resolveOptions } from '../packages/slidev/node'

const ENTRY_MD = `---
theme: none
---

# One

<<< ./snippets/one.ts

---

# Two

<<< ./snippets/two.ts
`

async function createReproServer(entry: string) {
  const options = await resolveOptions({ entry, theme: 'none' }, 'dev')
  const updatedSlides: number[] = []

  const server = await createServer(
    options,
    {
      plugins: [
        {
          name: 'slidev-snippet-hmr-capture',
          configureServer(s) {
            const hot = s.environments.client.hot
            const send = hot.send.bind(hot)
            hot.send = ((...args: any[]) => {
              if (args[0] === 'slidev:update-slide')
                updatedSlides.push(args[1].no)
              return (send as any)(...args)
            }) as typeof hot.send
          },
        },
      ],
      server: { middlewareMode: true },
      clearScreen: false,
      logLevel: 'error',
    },
    {
      async loadData(loadedSource) {
        const loaded = await parser.load(options, options.entry, loadedSource, 'dev')
        return {
          ...loaded,
          themeMeta: options.data.themeMeta,
          config: parser.resolveConfig(loaded.headmatter, options.data.themeMeta, options.entry),
        }
      },
    },
  )

  return { server, options, updatedSlides }
}

// What the browser does when it loads a slide: render its Markdown.
async function renderSlides(server: Awaited<ReturnType<typeof createServer>>, options: ResolvedSlidevOptions) {
  for (let i = 0; i < options.data.slides.length; i++)
    await server.environments.client.transformRequest(`${options.data.slides[i].source.filepath}__slidev_${i + 1}.md`)
}

describe('snippet import HMR (#2241)', () => {
  const cleanups: Array<() => Promise<void>> = []

  afterEach(async () => {
    while (cleanups.length)
      await cleanups.pop()!()
  })

  it('updates the importing slide on every snippet edit', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'slidev-snippet-hmr-'))
    const entry = join(dir, 'slides.md')
    await mkdir(join(dir, 'snippets'))
    await writeFile(join(dir, 'snippets/one.ts'), 'export const one = 1\n')
    await writeFile(join(dir, 'snippets/two.ts'), 'export const two = 2\n')
    await writeFile(entry, ENTRY_MD)

    const { server, options, updatedSlides } = await createReproServer(entry)
    cleanups.push(async () => {
      await server.close()
      await rm(dir, { recursive: true, force: true })
    })

    await renderSlides(server, options)

    await writeFile(join(dir, 'snippets/one.ts'), 'export const one = 10\n')
    await waitFor(() => updatedSlides.includes(1))
    expect(updatedSlides).toEqual([1])

    updatedSlides.length = 0
    await writeFile(join(dir, 'snippets/two.ts'), 'export const two = 20\n')
    await waitFor(() => updatedSlides.includes(2))
    expect(updatedSlides).toEqual([2])

    updatedSlides.length = 0
    await writeFile(join(dir, 'snippets/one.ts'), 'export const one = 100\n')
    await waitFor(() => updatedSlides.includes(1))
    expect(updatedSlides).toEqual([1])
  }, 30_000)

  it('still updates the importing slide after slides.md was edited', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'slidev-snippet-hmr-entry-'))
    const entry = join(dir, 'slides.md')
    await mkdir(join(dir, 'snippets'))
    await writeFile(join(dir, 'snippets/one.ts'), 'export const one = 1\n')
    await writeFile(join(dir, 'snippets/two.ts'), 'export const two = 2\n')
    await writeFile(entry, ENTRY_MD)

    const { server, options, updatedSlides } = await createReproServer(entry)
    cleanups.push(async () => {
      await server.close()
      await rm(dir, { recursive: true, force: true })
    })

    await renderSlides(server, options)

    await writeFile(entry, ENTRY_MD.replace('# One', '# One edited'))
    await waitFor(() => updatedSlides.includes(1))

    updatedSlides.length = 0
    await writeFile(join(dir, 'snippets/two.ts'), 'export const two = 20\n')
    await waitFor(() => updatedSlides.includes(2))
    expect(updatedSlides).toEqual([2])
  }, 30_000)
})

async function waitFor(predicate: () => boolean, timeout = 5_000, interval = 50) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (predicate())
      return
    await new Promise(r => setTimeout(r, interval))
  }
  throw new Error(`Timed out after ${timeout}ms waiting for HMR activity`)
}
