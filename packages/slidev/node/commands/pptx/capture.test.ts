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
function fakePage(options: { documentHeight: number, viewportHeight: number, box?: { x: number, y: number, width: number, height: number } }) {
  const calls: {
    clips: { x: number, y: number, width: number, height: number }[]
    viewports: number[]
    locators: string[]
    elementShots: number
  } = { clips: [], viewports: [], locators: [], elementShots: 0 }
  let scrollY = 0
  let viewportHeight = options.viewportHeight
  const page = {
    viewportSize: () => ({ width: 980, height: viewportHeight }),
    async setViewportSize({ height }: { height: number }) {
      viewportHeight = height
      calls.viewports.push(height)
    },
    async evaluate(fn: any, arg: any) {
      // Only scroll calls reach here, and they are told apart by their source
      // because all three are no-argument functions of `window`, which this
      // stands in for.
      if (typeof arg === 'number') {
        scrollY = Math.max(0, Math.min(arg, options.documentHeight - viewportHeight))
        return scrollY
      }
      if (String(fn).includes('scrollTo')) {
        scrollY = 0
        return undefined
      }
      return scrollY
    },
    async screenshot({ clip }: any) {
      calls.clips.push(clip)
      return Buffer.from('png')
    },
    locator(selector: string) {
      calls.locators.push(selector)
      return {
        first: () => ({
          count: async () => (options.box ? 1 : 0),
          // Viewport-relative, exactly as Playwright reports it.
          boundingBox: async () => (options.box ? { ...options.box, y: options.box.y - scrollY } : null),
          screenshot: async () => {
            calls.elementShots++
            return Buffer.from('png')
          },
        }),
      }
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

describe('an element is captured by clipping the page at its box', () => {
  const request = (sourceId: number): RasterRequest => ({ sourceId, isolate: false, hideDescendants: false })
  const slide = (sourceId: number) => ({
    no: 1,
    clickIndex: 0,
    containerId: '001-01',
    size: { w: 980, h: 552 },
    nodes: [{ kind: 'raster' as const, sourceId, rect: { x: 0, y: 0, w: 10, h: 10 }, data: '', reason: 'svg' as const, isolate: false, hideDescendants: false }],
  })

  it('clips rather than calling locator.screenshot', async () => {
    // `locator.screenshot()` is the obvious call and returns a region from
    // somewhere else entirely on a print page far taller than its viewport:
    // Slidev's own starter deck came back with a picture of slide one pasted
    // into slide four.
    const { page, calls } = fakePage({
      documentHeight: 28152,
      viewportHeight: 28152,
      box: { x: 100, y: 2049, width: 320, height: 194 },
    })
    const report = await capture(page, [slide(166)] as any, [request(166)])
    expect(calls.elementShots).toBe(0)
    expect(calls.clips).toEqual([{ x: 100, y: 1, width: 320, height: 194 }])
    expect(report.rastersCaptured).toBe(1)
  })

  it('reports a failure when the element is not there', async () => {
    const { page } = fakePage({ documentHeight: 28152, viewportHeight: 28152 })
    const report = await capture(page, [slide(166)] as any, [request(166)])
    expect(report.rastersFailed).toBe(1)
  })
})

describe('shootClip', () => {
  it('clamps a box that starts left of the page', async () => {
    // An absolutely positioned decoration can hang off the left edge, and
    // Chromium cannot capture a negative origin: it rejects the whole
    // screenshot, so the picture went missing rather than being trimmed.
    const { page, calls } = fakePage({ documentHeight: 5000, viewportHeight: 2000 })
    await shootClip(page, { x: -28, y: 100, w: 320, h: 194 })
    expect(calls.clips).toEqual([{ x: 0, y: 1, width: 292, height: 194 }])
  })

  it('gives up on a box with nothing left to capture', async () => {
    const { page, calls } = fakePage({ documentHeight: 5000, viewportHeight: 2000 })
    expect(await shootClip(page, { x: -400, y: 100, w: 320, h: 194 })).toBeUndefined()
    expect(calls.clips).toEqual([])
  })
})
