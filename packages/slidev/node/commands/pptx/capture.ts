import type { Page } from 'playwright-chromium'
import type { IrImage, IrRaster, SlideIr } from './ir'
import type { RasterRequest } from './normalize'
import { Buffer } from 'node:buffer'

/**
 * The only Playwright glue in the exporter.
 *
 * Measurement happens in one `page.evaluate`, but rasterization cannot: an
 * element screenshot has to be driven from Node, and isolating an element for
 * one means mutating the DOM of a live Vue app. So this is deliberately a
 * second phase, run strictly after every measurement is already in hand. No
 * geometry is ever read from a page this module has touched.
 */

export const ID_ATTRIBUTE = 'data-slidev-export-id'

/** Marks an element this module hid, and remembers what to put back. */
const RESTORE_ATTRIBUTE = 'data-slidev-export-restore'

/**
 * Hide everything except the target and its ancestors.
 *
 * `locator.screenshot()` CLIPS THE PAGE to the element's box; it does not
 * isolate the element. Without this, a backdrop's picture contains whatever is
 * painted on top of it, and that content is then drawn again as shapes, so
 * every word on the slide appears twice.
 *
 * `visibility` rather than `display`, because `display: none` removes the box
 * and reflows the siblings, which would move the very element being captured.
 */
async function isolate(page: Page, id: number, hideDescendants: boolean): Promise<void> {
  await page.evaluate(
    ({ id, idAttribute, restoreAttribute, hideDescendants }) => {
      const target = document.querySelector(`[${idAttribute}="${id}"]`)
      if (!target)
        return

      const hide = (el: Element) => {
        const html = el as HTMLElement
        html.setAttribute(restoreAttribute, html.style.visibility || '')
        html.style.visibility = 'hidden'
      }

      // The target's own descendants, but ONLY when they are redrawn as
      // shapes afterwards. That holds for a backdrop, whose children are
      // walked, and not for a leaf such as an `<svg>`, whose children ARE its
      // artwork: hiding those emptied the decorative chrome out of the slide.
      if (hideDescendants) {
        for (const child of Array.from(target.children))
          hide(child)
      }

      let node: Element | null = target
      while (node && node.parentElement) {
        for (const sibling of Array.from(node.parentElement.children)) {
          if (sibling === node)
            continue
          hide(sibling)
        }
        node = node.parentElement
      }
    },
    { id, idAttribute: ID_ATTRIBUTE, restoreAttribute: RESTORE_ATTRIBUTE, hideDescendants },
  )
}

/**
 * Put back everything `isolate` hid.
 *
 * Driven off an attribute rather than a remembered list, so it is correct even
 * if a previous restore was interrupted. It runs in a `finally`: leaving the
 * deck half-hidden would corrupt every capture after it.
 */
async function restore(page: Page): Promise<void> {
  await page.evaluate((restoreAttribute) => {
    for (const el of Array.from(document.querySelectorAll(`[${restoreAttribute}]`))) {
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

async function shoot(page: Page, selector: string): Promise<string | undefined> {
  const locator = page.locator(selector).first()
  if (!(await locator.count()))
    return undefined
  const buffer = await locator.screenshot({ omitBackground: true, timeout: 10_000 })
  return `data:image/png;base64,${buffer.toString('base64')}`
}

/**
 * Fetch an image through Playwright rather than through the page.
 *
 * The in-page route is `canvas.toDataURL()`, which THROWS on a cross-origin
 * image because the canvas is tainted, and Slidev's own starter deck uses a
 * remote cover photo. `APIRequestContext` is not subject to CORS.
 */
async function fetchImage(page: Page, url: string): Promise<string | undefined> {
  if (url.startsWith('data:'))
    return url
  try {
    const response = await page.context().request.get(url, { timeout: 15_000 })
    if (!response.ok())
      return undefined
    const type = response.headers()['content-type']?.split(';')[0] ?? 'image/png'
    // An SVG fetched here would be embedded as an SVG picture, and pptxgenjs
    // writes a broken raster fallback for those from Node. Let the caller
    // screenshot the element instead.
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
  fallbackSlides: { no: number, reason: string }[]
}

/**
 * Fill in every picture the IR asked for, and shoot whole-slide fallbacks.
 *
 * Mutates `slides` in place, because the IR is a private intermediate and
 * copying a deck's worth of base64 to stay pure would be a real cost for no
 * real benefit.
 */
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
    fallbackSlides: [],
  }

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

  for (const request of requests) {
    let data: string | undefined
    try {
      if (request.isolate)
        await isolate(page, request.sourceId, request.hideDescendants)
      data = request.clip
        // A pseudo-element has no element to point at, so the page is clipped
        // to the box the walker computed for it instead.
        ? `data:image/png;base64,${(await page.screenshot({
          clip: { x: request.clip.x, y: request.clip.y, width: request.clip.w, height: request.clip.h },
          omitBackground: true,
          timeout: 10_000,
        })).toString('base64')}`
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

  for (const [sourceId, nodes] of imagesBySource) {
    const url = nodes[0].data
    const data = await fetchImage(page, url)
    for (const node of nodes) {
      if (data) {
        node.data = data
        report.imagesFetched++
      }
      else {
        // Could not be fetched, or is an SVG that pptxgenjs would embed with a
        // broken fallback. Either way, a picture of the element is honest.
        const shot = await shoot(page, `[${ID_ATTRIBUTE}="${sourceId}"]`)
        if (shot) {
          node.data = shot
          report.rastersCaptured++
        }
      }
    }
  }

  // Anything without real image data would reach pptxgenjs as a bare URL or an
  // empty string. It answers with `Image 'data' value lacks a base64 header!`
  // on stderr and writes nothing, so the picture is missing either way and the
  // export looks like it crashed.
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

  for (const slide of slides) {
    if (!slide.fallbackReason)
      continue
    // The exact container id. A prefix match plus `.first()` handed every
    // click step of a slide the picture of step one.
    const shot = await shoot(page, `[id="${slide.containerId}"]`)
    if (shot) {
      slide.fallbackPng = shot
      report.fallbackSlides.push({ no: slide.no, reason: slide.fallbackReason })
    }
    else {
      // No picture either. The slide falls back to whatever shapes it has, but
      // `normalize` withheld its raster requests, so its pictures were already
      // dropped. Clearing the reason here hid that: the slide came out gutted
      // and the warning that would have explained it was suppressed.
      report.fallbackSlides.push({
        no: slide.no,
        reason: `${slide.fallbackReason}, and the replacement screenshot failed, so the slide is incomplete`,
      })
      slide.fallbackReason = undefined
    }
  }

  return report
}
