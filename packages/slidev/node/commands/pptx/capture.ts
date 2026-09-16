import type { Page } from 'playwright-chromium'
import type { IrImage, IrRaster, Rect, SlideIr } from './ir'
import type { RasterRequest } from './normalize'
import { Buffer } from 'node:buffer'

/**
 * The only Playwright glue in the exporter. Rasterization runs as a second phase,
 * after every measurement is in hand, because isolating an element for a screenshot
 * means mutating the DOM of the live app. Only inline `visibility`/`background-color`
 * (no reflow) and the viewport height are touched; width is what `PrintContainer`
 * scales from, so the coordinates the walker measured stay valid here.
 */

export const ID_ATTRIBUTE = 'data-slidev-export-id'

/** Marks an element this module hid, and remembers what to put back. */
const RESTORE_ATTRIBUTE = 'data-slidev-export-restore'

/**
 * Cache the document plus every open shadow root on `window`. `isolate` and `restore`
 * both need to see inside shadow roots (Mermaid renders into one), and rescanning the
 * tree per capture is a full walk per picture. Built on first use, after every slide has rendered.
 */
async function installRootFinder(page: Page): Promise<void> {
  await page.evaluate(() => {
    if ((window as any).__slidevExportRoots)
      return
    let cache: (Document | ShadowRoot)[] | undefined
    ;(window as any).__slidevExportRoots = () => {
      if (cache)
        return cache
      const found: (Document | ShadowRoot)[] = [document]
      const collect = (root: Document | ShadowRoot) => {
        for (const el of Array.from(root.querySelectorAll('*'))) {
          const shadow = (el as any).shadowRoot
          if (shadow) {
            found.push(shadow)
            collect(shadow)
          }
        }
      }
      collect(document)
      cache = found
      return cache
    }
  })
}

/**
 * Hide everything except the target and its ancestors. `locator.screenshot()` clips
 * the page to the element's box rather than isolating it, so overlapping content would
 * be captured and then drawn again as shapes. `visibility` rather than `display`:
 * `display: none` reflows and moves the target.
 */
async function isolate(page: Page, id: number, hideDescendants: boolean): Promise<boolean> {
  return await page.evaluate(
    ({ id, idAttribute, restoreAttribute, hideDescendants }) => {
      // `document.querySelector` does not pierce shadow DOM while `page.locator` does,
      // so the screenshot succeeds even when isolation silently misses a shadow-DOM target.
      const roots = (window as any).__slidevExportRoots() as (Document | ShadowRoot)[]
      let target: Element | null = null
      for (const root of roots) {
        const hit = root.querySelector(`[${idAttribute}="${id}"]`)
        if (hit) {
          target = hit
          break
        }
      }
      if (!target)
        return false

      const hide = (el: Element) => {
        const html = el as HTMLElement
        html.setAttribute(restoreAttribute, html.style.visibility || '')
        html.style.visibility = 'hidden'
      }

      // `omitBackground` only drops the browser's default backdrop; clear ancestor
      // backgrounds too, or a mostly transparent element captures an opaque one.
      const clear = (el: Element) => {
        const html = el as HTMLElement
        html.setAttribute(`${restoreAttribute}-bg`, html.style.backgroundColor || '')
        html.style.backgroundColor = 'transparent'
      }

      // Only correct when the descendants are redrawn as shapes afterwards;
      // a leaf's children are its artwork.
      if (hideDescendants) {
        for (const child of Array.from(target.children))
          hide(child)
        // A direct text child has no element to hide; make it transparent.
        const html = target as HTMLElement
        html.setAttribute(`${restoreAttribute}-color`, html.style.color || '')
        html.style.color = 'transparent'
      }

      // Climbs through shadow boundaries: `parentElement` is null at the top
      // of a shadow tree, so a loop conditioned on it hides nothing there.
      let node: Element = target
      for (;;) {
        const parent: HTMLElement | null = node.parentElement
        if (parent) {
          for (const sibling of Array.from(parent.children)) {
            if (sibling !== node)
              hide(sibling)
          }
          // The target keeps its own background: a backdrop is the thing captured.
          clear(parent)
          node = parent
          continue
        }
        const root = node.getRootNode() as ShadowRoot
        if (!root || !root.host)
          break
        for (const sibling of Array.from(root.children)) {
          if (sibling !== node)
            hide(sibling)
        }
        node = root.host
      }
      return true
    },
    { id, idAttribute: ID_ATTRIBUTE, restoreAttribute: RESTORE_ATTRIBUTE, hideDescendants },
  )
}

/**
 * Put back everything `isolate` hid. Driven off an attribute rather than a remembered
 * list, so it is correct even if a previous restore was interrupted. Runs in a
 * `finally`: a half-hidden deck corrupts every capture after it.
 */
async function restore(page: Page): Promise<void> {
  await page.evaluate((restoreAttribute) => {
    // Shadow roots too, or elements hidden inside them stay hidden.
    const roots = (window as any).__slidevExportRoots()
    const all = (selector: string) => roots.flatMap((root: Document | ShadowRoot) => Array.from(root.querySelectorAll(selector)))
    for (const el of all(`[${restoreAttribute}-bg]`)) {
      const previous = el.getAttribute(`${restoreAttribute}-bg`) ?? ''
      const style = (el as HTMLElement).style
      if (previous)
        style.backgroundColor = previous
      else
        style.removeProperty('background-color')
      el.removeAttribute(`${restoreAttribute}-bg`)
    }
    for (const el of all(`[${restoreAttribute}-color]`)) {
      const previous = el.getAttribute(`${restoreAttribute}-color`) ?? ''
      const style = (el as HTMLElement).style
      if (previous)
        style.color = previous
      else
        style.removeProperty('color')
      el.removeAttribute(`${restoreAttribute}-color`)
    }
    for (const el of all(`[${restoreAttribute}]`)) {
      const previous = el.getAttribute(restoreAttribute) ?? ''
      const style = (el as HTMLElement).style
      if (previous)
        style.visibility = previous
      else
        style.removeProperty('visibility')
      el.removeAttribute(restoreAttribute)
    }
  }, RESTORE_ATTRIBUTE)
}

/**
 * Screenshot an element, or return undefined; never throws, since two of the three
 * call sites are fallback paths. `locator.screenshot()` is not used: on a print page
 * far taller than its viewport it returns a region from elsewhere on the page
 * entirely, so the element's live box is read and the page clipped at it instead.
 */
async function shoot(page: Page, selector: string): Promise<string | undefined> {
  try {
    const locator = page.locator(selector).first()
    if (!(await locator.count()))
      return undefined
    const box = await locator.boundingBox()
    if (!box || box.width <= 0 || box.height <= 0)
      return undefined
    // `boundingBox()` is viewport-relative; `shootClip` wants document coordinates.
    const scrollY = await page.evaluate(() => window.scrollY)
    return await shootClip(page, { x: box.x, y: box.y + scrollY, w: box.width, h: box.height })
  }
  catch {
    return undefined
  }
}

/**
 * Chromium silently truncates captures past roughly twenty thousand CSS pixels, and
 * the print route sizes its viewport to the whole deck, so on a long deck every clip
 * below that point fails. Clips are taken through a short, scrolled viewport instead.
 */
const CLIP_VIEWPORT_MIN_HEIGHT = 2000

/**
 * A viewport tall enough to hold the tallest thing being captured: with `canvasWidth: 3840`
 * a single 16:9 slide is 2160 tall, so a fixed height would fail every whole-slide clip.
 */
function clipViewportHeight(slides: SlideIr[], requests: RasterRequest[]): number {
  const tallest = Math.max(
    0,
    ...slides.map(slide => slide.size.h),
    ...requests.map(request => request.clip?.h ?? 0),
  )
  return Math.max(CLIP_VIEWPORT_MIN_HEIGHT, Math.ceil(tallest) + 200)
}

/**
 * Screenshot a rectangle of the document. `clip` is in document coordinates while
 * Playwright reads it as viewport-relative, so the region is scrolled to first and the
 * clip rebased onto the scroll position actually reached. `fullPage` is not an option:
 * on a long deck it asks Chromium for a bitmap large enough to kill the page.
 */
export async function shootClip(page: Page, clip: Rect): Promise<string | undefined> {
  // Chromium rejects a clip with a negative origin outright; clamp and keep what there is.
  const x = Math.max(0, clip.x)
  const y = Math.max(0, clip.y)
  const w = clip.w - (x - clip.x)
  const h = clip.h - (y - clip.y)
  if (w <= 0 || h <= 0)
    return undefined
  try {
    const scrollY = await page.evaluate((top) => {
      window.scrollTo(0, top)
      return window.scrollY
    }, Math.max(0, y - 1))
    const buffer = await page.screenshot({
      clip: { x, y: y - scrollY, width: w, height: h },
      omitBackground: true,
      timeout: 10_000,
    })
    return `data:image/png;base64,${buffer.toString('base64')}`
  }
  catch {
    return undefined
  }
}

/**
 * Whether a data URI can be embedded as-is. pptxgenjs needs `image/<type>;base64,` and
 * emits nothing for a URL-encoded data URI; SVG is rasterized on this path regardless.
 * Both fall through to a screenshot.
 */
export function isUsableDataUri(url: string): boolean {
  return /^data:image\/(?!svg\+xml)[\w.+-]+;base64,/.test(url)
}

/**
 * Fetch an image through `APIRequestContext`, which is not subject to CORS;
 * the in-page route, `canvas.toDataURL()`, throws on a cross-origin image.
 */
async function fetchImage(page: Page, url: string): Promise<string | undefined> {
  if (url.startsWith('data:'))
    return isUsableDataUri(url) ? url : undefined
  try {
    const response = await page.context().request.get(url, { timeout: 15_000 })
    if (!response.ok())
      return undefined
    const type = response.headers()['content-type']?.split(';')[0] ?? 'image/png'
    // pptxgenjs writes a broken raster fallback for SVG from Node; let the
    // caller screenshot the element instead.
    if (type.includes('svg'))
      return undefined
    const body = await response.body()
    return `data:${type};base64,${Buffer.from(body).toString('base64')}`
  }
  catch {
    return undefined
  }
}

export interface CaptureReport {
  rastersCaptured: number
  rastersFailed: number
  imagesFetched: number
  /** Images that could be neither fetched nor screenshotted. */
  imagesDropped: number
  /** Captures that asked for isolation and could not find their element. A silent miss bakes the slide's own text into the picture, which is then drawn again as shapes. */
  isolationMissed: number
  fallbackSlides: { no: number, reason: string }[]
}

/**
 * Run every capture through one short, scrollable viewport. Resizing reflows the page,
 * so it happens once around all of them rather than per capture; boxes are read live
 * inside this viewport, so they stay consistent with it.
 */
async function throughShortViewport(page: Page, needed: boolean, height: number, fn: () => Promise<void>): Promise<void> {
  if (!needed) {
    await fn()
    return
  }
  const viewport = page.viewportSize()
  try {
    if (viewport && viewport.height > height)
      await page.setViewportSize({ width: viewport.width, height })
    await fn()
  }
  finally {
    if (viewport)
      await page.setViewportSize(viewport)
    await page.evaluate(() => window.scrollTo(0, 0))
  }
}

/** Fill in every picture the IR asked for, and shoot whole-slide fallbacks. Mutates `slides` in place. */
export async function capture(
  page: Page,
  slides: SlideIr[],
  requests: RasterRequest[],
): Promise<CaptureReport> {
  const report: CaptureReport = {
    rastersCaptured: 0,
    rastersFailed: 0,
    imagesFetched: 0,
    imagesDropped: 0,
    isolationMissed: 0,
    fallbackSlides: [],
  }

  await installRootFinder(page)

  const rasterBySource = new Map<number, IrRaster[]>()
  const imagesBySource = new Map<number, IrImage[]>()
  for (const slide of slides) {
    for (const node of slide.nodes) {
      if (node.kind === 'raster') {
        const list = rasterBySource.get(node.sourceId) ?? []
        list.push(node)
        rasterBySource.set(node.sourceId, list)
      }
      else if (node.kind === 'image') {
        const list = imagesBySource.get(node.sourceId) ?? []
        list.push(node)
        imagesBySource.set(node.sourceId, list)
      }
    }
  }

  const fulfil = async (request: RasterRequest): Promise<void> => {
    let data: string | undefined
    try {
      if (request.isolate && !(await isolate(page, request.isolateId ?? request.sourceId, request.hideDescendants)))
        report.isolationMissed++
      // A pseudo-element has no element to point at; clip the page to the box
      // the walker computed for it instead.
      data = request.clip
        ? await shootClip(page, request.clip)
        : await shoot(page, `[${ID_ATTRIBUTE}="${request.sourceId}"]`)
    }
    catch {
      data = undefined
    }
    finally {
      if (request.isolate)
        await restore(page)
    }

    for (const node of rasterBySource.get(request.sourceId) ?? []) {
      if (data) {
        node.data = data
        report.rastersCaptured++
      }
      else {
        report.rastersFailed++
      }
    }
  }

  const viewportHeight = clipViewportHeight(slides, requests)

  await throughShortViewport(page, !!requests.length || !!imagesBySource.size, viewportHeight, async () => {
    for (const request of requests)
      await fulfil(request)

    for (const [sourceId, nodes] of imagesBySource) {
      let data = await fetchImage(page, nodes[0].data)
      if (data) {
        report.imagesFetched++
      }
      else {
        // Unfetchable, or an SVG: screenshot the element instead, isolated so
        // the picture does not carry what the slide painted behind it.
        try {
          if (!(await isolate(page, sourceId, false)))
            report.isolationMissed++
          // Once per element, not once per node it produced across click steps.
          data = await shoot(page, `[${ID_ATTRIBUTE}="${sourceId}"]`)
          if (data)
            report.imagesFetched++
        }
        finally {
          await restore(page)
        }
      }
      if (!data)
        continue
      for (const node of nodes)
        node.data = data
    }
  })

  // Anything without real image data would reach pptxgenjs as a bare URL or
  // an empty string, which it rejects on stderr while writing nothing.
  for (const slide of slides) {
    slide.nodes = slide.nodes.filter((node) => {
      if (node.kind === 'raster')
        return !!node.data
      if (node.kind === 'image' && !node.data.startsWith('data:')) {
        report.imagesDropped++
        return false
      }
      return true
    })
  }

  await throughShortViewport(page, slides.some(slide => !!slide.fallbackReason), viewportHeight, async () => {
    for (const slide of slides) {
      if (!slide.fallbackReason)
        continue
      // The exact container id: a prefix match plus `.first()` hands every
      // click step of a slide the picture of step one.
      const shot = await shoot(page, `[id="${slide.containerId}"]`)
      if (shot) {
        slide.fallbackPng = shot
        report.fallbackSlides.push({ no: slide.no, reason: slide.fallbackReason })
      }
      else {
        // Screenshot failed too. The slide keeps its shapes, but `normalize`
        // withheld its raster requests, so keep the warning and clear the reason.
        report.fallbackSlides.push({
          no: slide.no,
          reason: `${slide.fallbackReason}, and the replacement screenshot failed, so the slide is incomplete`,
        })
        slide.fallbackReason = undefined
      }
    }
  })

  return report
}
