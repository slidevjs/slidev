import type { HotPayload } from 'vite'
/**
 * Regression / repro for https://github.com/slidevjs/slidev/issues/2784
 *
 * On Vite 8, Slidev's slides loader always adds `/@slidev/title-renderer.md` to the
 * HMR module list whenever any slide content changes. When that virtual module is
 * present in the client module graph but not `isSelfAccepting` (common until import
 * analysis runs — the state observed in the browser for #2784), Vite's HMR
 * propagation dead-ends and sends `{ type: 'full-reload' }` instead of a hot update.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createServer, parser, resolveOptions } from '../packages/slidev/node'

const TITLE_RENDERER_MD = '/@slidev/title-renderer.md'

const ENTRY_MD = `---
theme: none
title: HMR Repro
---

# Hello

Body text

---

# Second

More
`

interface HmrCapture {
  fullReloads: Array<Extract<HotPayload, { type: 'full-reload' }>>
  slideUpdates: number
  moduleSnapshots: Array<Array<{ id: string | null, isSelfAccepting: boolean | undefined }>>
}

async function createReproServer(entry: string) {
  const options = await resolveOptions({ entry, theme: 'none' }, 'dev')
  const capture: HmrCapture = {
    fullReloads: [],
    slideUpdates: 0,
    moduleSnapshots: [],
  }

  const server = await createServer(
    options,
    {
      plugins: [{
        name: 'slidev-title-renderer-hmr-capture',
        hotUpdate: {
          order: 'post',
          handler(ctx) {
            if (!ctx.modules.length)
              return
            capture.moduleSnapshots.push(
              ctx.modules.map(m => ({
                id: m.id,
                isSelfAccepting: m.isSelfAccepting,
              })),
            )
          },
        },
        configureServer(s) {
          const hot = s.environments.client.hot
          const send = hot.send.bind(hot)
          hot.send = ((...args: Parameters<typeof hot.send>) => {
            const payload = args[0]
            if (payload && typeof payload === 'object' && payload.type === 'full-reload')
              capture.fullReloads.push(payload)
            if (typeof payload === 'string' && payload === 'slidev:update-slide')
              capture.slideUpdates += 1
            return send(...args)
          }) as typeof hot.send
        },
      }],
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

  return { server, options, capture }
}

describe('title-renderer HMR (#2784)', () => {
  const cleanups: Array<() => Promise<void>> = []

  afterEach(async () => {
    while (cleanups.length)
      await cleanups.pop()!()
  })

  it('does not full-reload on a body-only slides.md edit when title-renderer is in the module graph', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'slidev-title-renderer-hmr-'))
    const entry = join(dir, 'slides.md')
    await writeFile(entry, ENTRY_MD)

    const { server, capture } = await createReproServer(entry)
    cleanups.push(async () => {
      await server.close()
      await rm(dir, { recursive: true, force: true })
    })

    // Mirror the Vite 8 client graph state from #2784: the virtual module exists
    // (e.g. after overview/goto loaded it) but is not yet self-accepting.
    const titleMod = await server.environments.client.moduleGraph.ensureEntryFromUrl(TITLE_RENDERER_MD)
    expect(titleMod.isSelfAccepting).toBe(false)

    await writeFile(entry, ENTRY_MD.replace('Body text', 'Body text changed'))
    await waitFor(() => capture.slideUpdates > 0 || capture.fullReloads.length > 0)

    expect(capture.slideUpdates, 'Slidev should still emit slidev:update-slide').toBeGreaterThan(0)

    expect(
      capture.fullReloads,
      [
        'body-only edits must not trigger Vite full-reload via title-renderer.md.',
        `HMR modules seen: ${JSON.stringify(capture.moduleSnapshots)}`,
      ].join(' '),
    ).toEqual([])
  }, 20_000)
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
