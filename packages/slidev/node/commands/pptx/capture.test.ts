import type { Page } from 'playwright-chromium'
import type { DomSnapshot } from './capture'
import type { SlideIr } from './ir'
import type { RasterRequest } from './normalize'
import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { capture, generatedTextFrom, isUsableDataUri, readGeneratedText, shootClip } from './capture'

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

interface SnapshotNode {
  name: string
  parent?: number
  /** Attributes as written, e.g. the walker's id. */
  attrs?: Record<string, string>
  pseudo?: string
  /** One entry per layout object the node owns, in order; null for a box with no text. */
  layout?: (string | null)[]
}

/**
 * A `DOMSnapshot.captureSnapshot` result in the shape Chromium returns: one
 * flattened, interned table per document, with nodes in document order. A
 * pseudo-element owns several layout objects: its box, then one per text piece
 * of its `content` (`"Step " counter(x)` is a box, `Step ` and `7`).
 */
function domSnapshot(list: SnapshotNode[]): DomSnapshot {
  const strings: string[] = []
  const intern = (value: string): number => {
    const at = strings.indexOf(value)
    return at >= 0 ? at : strings.push(value) - 1
  }
  const pseudoNodes = list.flatMap((node, i) => node.pseudo ? [i] : [])
  const layout = list.flatMap((node, i) => (node.layout ?? []).map(text => ({ node: i, text })))
  return {
    strings,
    documents: [{
      nodes: {
        parentIndex: list.map(node => node.parent ?? -1),
        attributes: list.map(node => Object.entries(node.attrs ?? {}).flatMap(([k, v]) => [intern(k), intern(v)])),
        pseudoType: { index: pseudoNodes, value: pseudoNodes.map(i => intern(list[i].pseudo!)) },
      },
      layout: {
        nodeIndex: layout.map(entry => entry.node),
        text: layout.map(entry => entry.text === null ? -1 : intern(entry.text)),
      },
    }],
  }
}

const ID = 'data-slidev-export-id'

/**
 * The number a CSS counter draws is not in the DOM or in any computed style;
 * only the layout tree has it. A wrong mapping here puts one item's number on
 * another, so it is keyed by the walker's element id, never by position.
 */
describe('generatedTextFrom', () => {
  it('reads a counter by the id of the element that owns it', () => {
    const snapshot = domSnapshot([
      { name: 'OL' },
      { name: 'LI', parent: 0, attrs: { [ID]: '7' } },
      { name: '::before', parent: 1, pseudo: 'before', layout: [null, '1'] },
      { name: 'LI', parent: 0, attrs: { [ID]: '9' } },
      { name: '::before', parent: 3, pseudo: 'before', layout: [null, '2'] },
    ])
    expect(generatedTextFrom(snapshot, ID)).toEqual(new Map([['7::BEFORE', '1'], ['9::BEFORE', '2']]))
  })

  it('keeps two lists apart when their items read the same', () => {
    // A second list restarts at 1, and its first item says "Run" like the first
    // list's second item: neither the text nor the order may decide the match.
    const snapshot = domSnapshot([
      { name: 'LI', attrs: { [ID]: '2' } },
      { name: '::before', parent: 0, pseudo: 'before', layout: [null, '2'] },
      { name: '#text', parent: 0, layout: ['Run'] },
      { name: 'LI', attrs: { [ID]: '5' } },
      { name: '::before', parent: 3, pseudo: 'before', layout: [null, '1'] },
      { name: '#text', parent: 3, layout: ['Run'] },
    ])
    expect(generatedTextFrom(snapshot, ID)).toEqual(new Map([['2::BEFORE', '2'], ['5::BEFORE', '1']]))
  })

  it('joins the pieces of a string and a counter', () => {
    const snapshot = domSnapshot([
      { name: 'DIV', attrs: { [ID]: '3' } },
      { name: '::before', parent: 0, pseudo: 'before', layout: [null, 'Step ', '7'] },
    ])
    expect(generatedTextFrom(snapshot, ID).get('3::BEFORE')).toBe('Step 7')
  })

  it('leaves out a marker nested in the decoration', () => {
    // A `::before` with `display: list-item` owns a `::marker` of its own; its
    // bullet is a separate box, and read as text it landed after the label.
    const snapshot = domSnapshot([
      { name: 'P', attrs: { [ID]: '3' } },
      { name: '::before', parent: 0, pseudo: 'before', layout: [null, 'label'] },
      { name: '::marker', parent: 1, pseudo: 'marker', layout: [null, '• '] },
    ])
    expect(generatedTextFrom(snapshot, ID).get('3::BEFORE')).toBe('label')
  })

  it('keys ::after apart from ::before', () => {
    const snapshot = domSnapshot([
      { name: 'A', attrs: { [ID]: '4' } },
      { name: '::before', parent: 0, pseudo: 'before', layout: [null, '['] },
      { name: '::after', parent: 0, pseudo: 'after', layout: [null, '↗'] },
    ])
    expect(generatedTextFrom(snapshot, ID)).toEqual(new Map([['4::BEFORE', '['], ['4::AFTER', '↗']]))
  })

  it('skips pseudo-elements the walker never stamped, and other pseudo types', () => {
    const snapshot = domSnapshot([
      { name: 'LI' },
      { name: '::before', parent: 0, pseudo: 'before', layout: [null, '1'] },
      { name: 'LI', attrs: { [ID]: '6' } },
      { name: '::marker', parent: 2, pseudo: 'marker', layout: [null, '1. '] },
    ])
    expect(generatedTextFrom(snapshot, ID).size).toBe(0)
  })

  it('returns nothing for a page without pseudo-elements', () => {
    const snapshot = domSnapshot([{ name: 'P', attrs: { [ID]: '0' } }, { name: '#text', parent: 0, layout: ['hi'] }])
    delete snapshot.documents[0].nodes.pseudoType
    expect(generatedTextFrom(snapshot, ID).size).toBe(0)
  })
})

/** A page whose CDP session answers `send` and `detach` with the promises given. */
function cdpPage(send: () => Promise<unknown>, detach: () => Promise<void> = async () => {}): Page {
  return { context: () => ({ newCDPSession: async () => ({ send, detach }) }) } as unknown as Page
}

/**
 * Playwright gives CDP calls no timeout of their own, so a renderer that never
 * answers would hold the export forever, past the fallback it is meant to reach.
 */
describe('readGeneratedText', () => {
  it('falls back when the snapshot never answers', async () => {
    const page = cdpPage(() => new Promise(() => {}))
    expect(await readGeneratedText(page, { snapshotMs: 20, detachMs: 20 })).toBeUndefined()
  })

  it('falls back when the snapshot fails', async () => {
    const page = cdpPage(async () => {
      throw new Error('DOMSnapshot.captureSnapshot: not supported')
    })
    expect(await readGeneratedText(page, { snapshotMs: 20, detachMs: 20 })).toBeUndefined()
  })

  it('still detaches a session that arrives after the deadline', async () => {
    let resolveSession!: (session: unknown) => void
    let detached = 0
    const page = { context: () => ({ newCDPSession: () => new Promise((resolve) => {
      resolveSession = resolve
    }) }) } as unknown as Page
    expect(await readGeneratedText(page, { snapshotMs: 20, detachMs: 20 })).toBeUndefined()
    // Left attached, it would hold a CDP session open until the page closes.
    resolveSession({ send: async () => ({}), detach: async () => {
      detached++
    } })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(detached).toBe(1)
  })

  it('returns the snapshot even when detaching never finishes', async () => {
    const snapshot = domSnapshot([
      { name: 'LI', attrs: { [ID]: '1' } },
      { name: '::before', parent: 0, pseudo: 'before', layout: [null, '1'] },
    ])
    const page = cdpPage(async () => snapshot, () => new Promise(() => {}))
    expect(await readGeneratedText(page, { snapshotMs: 20, detachMs: 20 })).toEqual(new Map([['1::BEFORE', '1']]))
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

/**
 * The warning reports pictures that reached the file, so a counter whose capture
 * failed, or a slide replaced by its whole-slide picture, is not counted.
 */
describe('generated-content pictures are counted when they reach the file', () => {
  const request = (sourceId: number): RasterRequest => ({ sourceId, isolate: false, hideDescendants: false })
  const slide = (reason: 'generated-content' | 'svg', extra: object = {}) => ({
    no: 1,
    clickIndex: 0,
    containerId: '001-01',
    size: { w: 980, h: 552 },
    nodes: [{ kind: 'raster' as const, sourceId: 7, rect: { x: 0, y: 0, w: 10, h: 10 }, data: '', reason, isolate: false, hideDescendants: false }],
    ...extra,
  })
  const box = { x: 0, y: 0, width: 10, height: 10 }

  it('counts a captured counter', async () => {
    const { page } = fakePage({ documentHeight: 552, viewportHeight: 552, box })
    const report = await capture(page, [slide('generated-content')] as SlideIr[], [request(7)])
    expect(report.generatedContentPictures).toBe(1)
  })

  it('does not count a counter whose capture failed', async () => {
    const { page } = fakePage({ documentHeight: 552, viewportHeight: 552 })
    const report = await capture(page, [slide('generated-content')] as SlideIr[], [request(7)])
    expect(report.rastersFailed).toBe(1)
    expect(report.generatedContentPictures).toBe(0)
  })

  it('does not count pictures taken for other reasons', async () => {
    const { page } = fakePage({ documentHeight: 552, viewportHeight: 552, box })
    const report = await capture(page, [slide('svg')] as SlideIr[], [request(7)])
    expect(report.generatedContentPictures).toBe(0)
  })

  it('does not count a slide exported as one picture', async () => {
    const { page } = fakePage({ documentHeight: 552, viewportHeight: 552, box })
    const fallback = slide('generated-content', { fallbackReason: 'mostly pictures' })
    fallback.nodes[0].data = 'data:image/png;base64,iVBORw0KGgo='
    const report = await capture(page, [fallback] as SlideIr[], [])
    expect(report.fallbackSlides).toHaveLength(1)
    expect(report.generatedContentPictures).toBe(0)
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
