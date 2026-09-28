import type { Page } from 'playwright-chromium'
import type { IrImage, SlideIr } from './ir'
import type { RasterRequest } from './normalize'
import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { capture, isUsableDataUri, shootClip } from './capture'
import { normalize } from './normalize'

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
    imageIsolation: number[]
  } = { clips: [], viewports: [], locators: [], elementShots: 0, imageIsolation: [] }
  let scrollY = 0
  let viewportHeight = options.viewportHeight
  const page = {
    viewportSize: () => ({ width: 980, height: viewportHeight }),
    async setViewportSize({ height }: { height: number }) {
      viewportHeight = height
      calls.viewports.push(height)
    },
    async evaluate(fn: any, arg: any) {
      if (arg?.hideDecoration)
        calls.imageIsolation.push(arg.id)
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

describe('image screenshot fallback', () => {
  const PNG = 'data:image/png;base64,cG5n'
  function slide(data: string, required = false): SlideIr {
    return {
      no: 1,
      clickIndex: 0,
      containerId: '001-01',
      size: { w: 980, h: 552 },
      nodes: [
        { kind: 'box', sourceId: 1, rect: { x: 0, y: 20, w: 180, h: 200 }, fill: { r: 0, g: 0, b: 0, a: 0.25 } },
        {
          kind: 'image',
          sourceId: 1,
          data,
          rect: { x: 0, y: 20, w: 170, h: 200 },
          crop: { x: 230, y: 0, w: 400, h: 200 },
          opacity: 0.25,
          screenshot: { rect: { x: 0, y: 20, w: 180, h: 200 }, clip: { x: 20, y: 0, w: 180, h: 200 }, required },
        },
      ],
    }
  }

  it('keeps crop, alpha, and separate decoration when the original can be embedded', async () => {
    const { page, calls } = fakePage({ documentHeight: 3000, viewportHeight: 2000 })
    const ir = slide(PNG)
    const report = await capture(page, [ir], [])
    expect(report.imagesFetched).toBe(1)
    expect(calls.clips).toEqual([])
    expect(ir.nodes).toHaveLength(2)
    expect(ir.nodes[1]).toMatchObject({ data: PNG, crop: { x: 230, y: 0, w: 400, h: 200 }, opacity: 0.25 })
  })

  it.each([
    ['SVG', 'data:image/svg+xml;base64,PHN2Zy8+', false],
    ['unfetchable image', 'https://example.com/photo.png', false],
    ['unsupported object-position', PNG, true],
  ] as const)('captures %s content once, retaining native decoration without applying crop or alpha twice', async (_reason, data, required) => {
    const { page, calls } = fakePage({ documentHeight: 3000, viewportHeight: 2000, box: { x: -20, y: 2020, width: 200, height: 200 } })
    const ir = slide(data, required)
    const report = await capture(page, [ir], [])
    expect(report.imagesFetched).toBe(1)
    expect(calls.clips).toEqual([{ x: 0, y: 1020, width: 180, height: 200 }])
    expect(calls.imageIsolation).toEqual([1])
    expect(ir.nodes).toHaveLength(2)
    expect(ir.nodes[0].kind).toBe('box')
    const image = ir.nodes[1] as IrImage
    expect(image.rect).toEqual({ x: 0, y: 20, w: 180, h: 200 })
    expect(image.data).toBe(PNG)
    expect(image.crop).toBeUndefined()
    expect(image.opacity).toBeUndefined()
  })

  it('keeps the native shadow outside the image screenshot bounds', async () => {
    const { page, calls } = fakePage({ documentHeight: 3000, viewportHeight: 2000, box: { x: 0, y: 20, width: 180, height: 200 } })
    const ir = slide('data:image/svg+xml;base64,PHN2Zy8+')
    const box = ir.nodes[0]
    if (box.kind !== 'box')
      throw new Error('Expected the image decoration')
    box.shadow = { blur: 5, offset: 14, angle: 45, color: { r: 0, g: 0, b: 0, a: 1 } }
    await capture(page, [ir], [])
    expect(calls.imageIsolation).toEqual([1])
    expect(ir.nodes[0]).toBe(box)
    expect(box.shadow).toBeDefined()
  })

  it.each([
    ['background and borders', { backgroundColor: 'rgb(255, 0, 0)', borderTopWidth: '4px', borderTopStyle: 'solid', borderTopColor: 'rgb(0, 0, 0)' }, true],
    ['only a shadow', { boxShadow: 'rgb(0, 0, 0) 2px 2px 5px 0px' }, false],
  ] as const)('only hides decoration represented by a native box for an inline image with %s', async (_name, decoration, hasBox) => {
    const rect = { x: 20, y: 20, w: 100, h: 100 }
    const { slides, rasterRequests } = normalize({
      styles: [
        { display: 'block', whiteSpace: 'normal', fontFamily: 'Arial', textDecorationLine: 'none' },
        { display: 'inline', ...decoration },
      ] as any,
      fontResolution: {},
      unplaceablePseudos: [],
      slides: [{
        no: 1,
        clickIndex: 0,
        containerId: '001-01',
        size: { w: 980, h: 552 },
        nodes: [
          { id: 0, parent: -1, tag: 'P', style: 0, rect },
          { id: 1, parent: 0, tag: '#text', style: -1, rect, text: 'Inline ' },
          { id: 2, parent: 0, tag: 'IMG', style: 1, rect, src: 'data:image/svg+xml;base64,PHN2Zy8+' },
          { id: 3, parent: 0, tag: '#text', style: -1, rect, text: ' picture' },
        ],
      }],
    }, { notes: new Map() })
    expect(slides[0].nodes.some(node => node.kind === 'box' && node.sourceId === 2)).toBe(hasBox)
    const { page, calls } = fakePage({ documentHeight: 3000, viewportHeight: 2000, box: { x: 20, y: 20, width: 100, height: 100 } })
    await capture(page, slides, rasterRequests)
    expect(calls.imageIsolation).toEqual(hasBox ? [2] : [])
    expect(slides[0].nodes.find(node => node.kind === 'image')).toMatchObject({ data: PNG, rect })
  })

  it('restores the full letterbox when a contained image needs a screenshot', async () => {
    const { page } = fakePage({ documentHeight: 3000, viewportHeight: 2000, box: { x: -20, y: 2020, width: 200, height: 200 } })
    const ir = slide('data:image/svg+xml;base64,PHN2Zy8+')
    const image = ir.nodes[1] as IrImage
    image.rect = { x: 0, y: 120, w: 180, h: 100 }
    delete image.crop
    await capture(page, [ir], [])
    expect(image.rect).toEqual({ x: 0, y: 20, w: 180, h: 200 })
  })

  it('reports a failed screenshot instead of embedding the unfitted original', async () => {
    const { page } = fakePage({ documentHeight: 3000, viewportHeight: 2000 })
    const ir = slide(PNG, true)
    const report = await capture(page, [ir], [])
    expect(report.imagesDropped).toBe(1)
    expect(ir.nodes.map(node => node.kind)).toEqual(['box'])
  })
})
