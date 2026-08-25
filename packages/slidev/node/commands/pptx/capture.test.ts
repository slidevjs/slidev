import type { Page } from 'playwright-chromium'
import type { RasterRequest } from './normalize'
import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { capture, isUsableDataUri, shootClip } from './capture'

/**
 * `capture.ts` needs a live browser, so only its pure predicates are unit
 * tested here. This one guards a real failure: pptxgenjs answers a data URI it
 * cannot parse by printing to stderr and writing no picture at all, so the
 * image is missing and the export still reports success.
 */
describe('isUsableDataUri', () => {
  it('accepts a base64 raster', () => {
    expect(isUsableDataUri('data:image/png;base64,iVBORw0KGgo=')).toBe(true)
    expect(isUsableDataUri('data:image/jpeg;base64,/9j/4AAQ')).toBe(true)
  })

  it('rejects a URL-encoded data URI, which is how inline SVG is usually written', () => {
    expect(isUsableDataUri('data:image/svg+xml,%3c!--%20icon%20--%3e')).toBe(false)
  })

  it('rejects SVG even when it is base64', () => {
    // pptxgenjs writes a broken raster fallback for SVG from Node, so these
    // are screenshotted rather than embedded.
    expect(isUsableDataUri('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false)
  })
})

/**
 * A page just real enough for the two things that geometry depends on: how far
 * it actually scrolled, and how tall its viewport is.
 */
function fakePage(options: { documentHeight: number, viewportHeight: number }) {
  const calls: { clips: { x: number, y: number, width: number, height: number }[], viewports: number[] } = {
    clips: [],
    viewports: [],
  }
  let scrollY = 0
  let viewportHeight = options.viewportHeight
  const page = {
    viewportSize: () => ({ width: 980, height: viewportHeight }),
    async setViewportSize({ height }: { height: number }) {
      viewportHeight = height
      calls.viewports.push(height)
    },
    async evaluate(fn: any, arg: any) {
      // Only the scroll calls reach here; both are written as a function of
      // `window`, which this stands in for.
      if (typeof arg === 'number') {
        scrollY = Math.max(0, Math.min(arg, options.documentHeight - viewportHeight))
        return scrollY
      }
      scrollY = 0
      return undefined
    },
    async screenshot({ clip }: any) {
      calls.clips.push(clip)
      return Buffer.from('png')
    },
  }
  return { page: page as unknown as Page, calls, scrollY: () => scrollY }
}

describe('a clip is taken relative to the scroll the page actually reached', () => {
  it('rebases the clip onto the real scroll position', () => {
    // `clip` is in DOCUMENT coordinates while Playwright reads it as
    // viewport-relative, so the difference has to come from where the browser
    // ended up, not from where it was asked to go.
    const { page, calls } = fakePage({ documentHeight: 28152, viewportHeight: 2000 })
    return shootClip(page, { x: 100, y: 20000, w: 300, h: 150 }).then(() => {
      expect(calls.clips).toEqual([{ x: 100, y: 1, width: 300, height: 150 }])
    })
  })

  it('does not scroll past the end of the document', () => {
    // At the very bottom the browser stops short of the requested offset. A
    // clip rebased on the REQUESTED offset lands above the region and
    // Playwright answers "clipped area is empty", which the caller swallows,
    // so the picture silently goes missing.
    const { page, calls } = fakePage({ documentHeight: 28152, viewportHeight: 2000 })
    return shootClip(page, { x: 0, y: 28100, w: 100, h: 50 }).then(() => {
      // Scroll stops at 26152, so the region is 1948 down the viewport.
      expect(calls.clips).toEqual([{ x: 0, y: 1948, width: 100, height: 50 }])
    })
  })
})

describe('clip captures run through a shortened viewport', () => {
  const request = (sourceId: number, clip?: { x: number, y: number, w: number, h: number }): RasterRequest =>
    ({ sourceId, isolate: false, hideDescendants: false, ...(clip ? { clip } : {}) })

  it('shortens the viewport for the clips and puts it back', async () => {
    // The print route sizes its viewport to the WHOLE deck, and past roughly
    // twenty thousand pixels Chromium truncates the capture surface, so every
    // clip in the last third of a long deck failed and its picture vanished
    // with nothing in the log to say so.
    const { page, calls } = fakePage({ documentHeight: 28152, viewportHeight: 28152 })
    const slides = [{
      no: 1,
      clickIndex: 0,
      containerId: '001-01',
      size: { w: 980, h: 552 },
      nodes: [{ kind: 'raster' as const, sourceId: 1, rect: { x: 0, y: 0, w: 10, h: 10 }, data: '', reason: 'svg' as const, isolate: false, hideDescendants: false }],
    }]
    const report = await capture(page, slides as any, [request(1, { x: 0, y: 20000, w: 10, h: 10 })])
    expect(calls.viewports).toEqual([2000, 28152])
    expect(report.rastersCaptured).toBe(1)
    expect(report.rastersFailed).toBe(0)
  })

  it('leaves the viewport alone when nothing needs a clip', async () => {
    const { page, calls } = fakePage({ documentHeight: 28152, viewportHeight: 28152 })
    await capture(page, [], [])
    expect(calls.viewports).toEqual([])
  })
})
