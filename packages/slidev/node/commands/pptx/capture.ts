import type { Page } from 'playwright-chromium'
import type { IrImage, IrRaster, Rect, SlideIr } from './ir'
import type { RasterRequest } from './normalize'
import { Buffer } from 'node:buffer'

/**
 * The only Playwright glue in the exporter.
 *
 * Measurement happens in one `page.evaluate`, but rasterization cannot: an
 * element screenshot has to be driven from Node, and isolating an element for
 * one means mutating the DOM of a live Vue app. So this is deliberately a
 * second phase, run strictly after every measurement is already in hand.
 *
 * What this module does to the page is confined to two kinds of change, and
 * neither one moves anything: inline `visibility` and `background-color`,
 * which do not reflow, and the viewport HEIGHT, which the print route's
 * fixed-size slide containers do not depend on. Its width is never touched,
 * and width is what `PrintContainer` scales from. So the coordinates the
 * walker measured stay valid here. A slide sizing itself in `vh` would break
 * that, and would break the image exporter's own clip arithmetic first.
 */

export const ID_ATTRIBUTE = 'data-slidev-export-id'

/** Marks an element this module hid, and remembers what to put back. */
const RESTORE_ATTRIBUTE = 'data-slidev-export-restore'

/**
 * Install a cached list of every root that can hold a captured element.
 *
 * The document plus every open shadow root, found by one tree walk and kept on
 * `window` for the rest of the export. `isolate` and `restore` both need it,
 * and both used to be written against `document` alone: the first found its
 * target through a fresh recursive scan per capture, and the second could not
 * see inside a shadow root at all, so anything hidden in one stayed hidden.
 *
 * Recomputed if a diagram renders late: the count of hosts is cheap to check
 * against the cache only by rescanning, so instead the cache is simply built
 * on first use, after every slide has already rendered.
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
async function isolate(page: Page, id: number, hideDescendants: boolean): Promise<boolean> {
  return await page.evaluate(
    ({ id, idAttribute, restoreAttribute, hideDescendants }) => {
      // `document.querySelector` does not pierce shadow DOM, and Mermaid
      // renders into one. `page.locator` DOES pierce, so the screenshot
      // succeeded while isolation silently did nothing, which is the doubling
      // this whole mechanism exists to prevent.
      //
      // The light DOM is tried first because that is where all but a handful
      // of elements live, and the shadow roots are found once and cached on
      // `window` rather than rescanning every element in the document for each
      // capture, which is a full tree walk per picture on a deck that has none.
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

      // `omitBackground` only drops the browser's DEFAULT backdrop. A slide
      // container paints its own white, and an ancestor's background is not a
      // sibling, so hiding siblings alone still captured it. A mostly
      // transparent element, an `<svg>` arrow spanning half the slide say,
      // then became an opaque white rectangle that covered everything under it
      // once PowerPoint painted it in front.
      const clear = (el: Element) => {
        const html = el as HTMLElement
        html.setAttribute(`${restoreAttribute}-bg`, html.style.backgroundColor || '')
        html.style.backgroundColor = 'transparent'
      }

      // The target's own descendants, but ONLY when they are redrawn as
      // shapes afterwards. That holds for a backdrop, whose children are
      // walked, and not for a leaf such as an `<svg>`, whose children ARE its
      // artwork: hiding those emptied the decorative chrome out of the slide.
      if (hideDescendants) {
        for (const child of Array.from(target.children))
          hide(child)
        // A direct text child has no element to hide, so it would still be
        // baked into the picture and then drawn again as a shape. Its own
        // colour is what makes it visible.
        const html = target as HTMLElement
        html.setAttribute(`${restoreAttribute}-color`, html.style.color || '')
        html.style.color = 'transparent'
      }

      // Climbs THROUGH a shadow boundary. `parentElement` is null at the top
      // of a shadow tree, so a loop conditioned on it hid nothing at all for a
      // target inside one, and still reported success: a Mermaid diagram with
      // a title over it kept the title in its picture and drew it again.
      let node: Element = target
      for (;;) {
        const parent: HTMLElement | null = node.parentElement
        if (parent) {
          for (const sibling of Array.from(parent.children)) {
            if (sibling !== node)
              hide(sibling)
          }
          // The target keeps its own background: for a backdrop that IS the
          // thing being captured.
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
 * Put back everything `isolate` hid.
 *
 * Driven off an attribute rather than a remembered list, so it is correct even
 * if a previous restore was interrupted. It runs in a `finally`: leaving the
 * deck half-hidden would corrupt every capture after it.
 */
async function restore(page: Page): Promise<void> {
  await page.evaluate((restoreAttribute) => {
    // Through the shadow roots as well. `isolate` hides elements inside them,
    // and a restore that cannot see those left them `visibility: hidden` for
    // every capture afterwards, including the whole-slide fallbacks.
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
 * Screenshot an element, or return undefined.
 *
 * Never throws. A detached, zero-sized or slow element makes the underlying
 * screenshot reject, and two of the three call sites are the FALLBACK paths,
 * so an unhandled rejection there crashed the whole export at the exact
 * moment it was trying to degrade gracefully.
 *
 * `locator.screenshot()` would be the obvious call and is WRONG here. On a
 * print page far taller than its viewport, and every deck with click steps is
 * one, it returns a region from somewhere else on the page entirely: Slidev's
 * own starter deck came back with a picture of slide one pasted into slide
 * four. Reading the element's live box and clipping the page at it returns the
 * right pixels, and is the same primitive a pseudo-element already uses.
 */
async function shoot(page: Page, selector: string): Promise<string | undefined> {
  try {
    const locator = page.locator(selector).first()
    if (!(await locator.count()))
      return undefined
    const box = await locator.boundingBox()
    if (!box || box.width <= 0 || box.height <= 0)
      return undefined
    // `boundingBox()` is viewport-relative, and `shootClip` wants document
    // coordinates, so whatever the page is scrolled to has to be added back.
    const scrollY = await page.evaluate(() => window.scrollY)
    return await shootClip(page, { x: box.x, y: box.y + scrollY, w: box.width, h: box.height })
  }
  catch {
    return undefined
  }
}

/**
 * The tallest viewport a clip screenshot is taken through.
 *
 * The print route sizes its viewport to the WHOLE deck, and Chromium can only
 * rasterize a surface so large: past roughly twenty thousand CSS pixels the
 * capture is silently truncated and every clip below that point answers
 * "Clipped area is either empty or outside the resulting image". On a fifty
 * slide deck that is the last third of the presentation, and because the
 * caller swallows the failure those pictures simply went missing.
 *
 * So clips are taken through a short viewport that is scrolled instead. Small
 * enough to be far under the limit, tall enough to hold any single element
 * worth capturing whole.
 */
const CLIP_VIEWPORT_MIN_HEIGHT = 2000

/**
 * A viewport tall enough to hold the tallest thing being captured.
 *
 * A fixed two thousand pixels is shorter than a single slide once the deck
 * sets `canvasWidth: 3840`, where 16:9 makes the slide 2160 tall. Every
 * full-bleed picture and every whole-slide fallback then asks for a clip
 * taller than the viewport and fails, silently, which is the exact class of
 * failure the short viewport was introduced to fix.
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
 * Screenshot a rectangle of the document.
 *
 * `clip` is in DOCUMENT coordinates while Playwright reads it as
 * viewport-relative, so the region is scrolled to first and the clip is
 * rebased onto the scroll position the browser actually reached, which is not
 * the one asked for at the very bottom of the page.
 *
 * `fullPage` would avoid the arithmetic and is wrong here for the same reason
 * the short viewport exists: a full-page capture of a forty slide deck asks
 * Chromium for a bitmap of some twenty-two thousand pixels squared at
 * `deviceScaleFactor: 2`, and the page dies with "Target page, context or
 * browser has been closed".
 */
export async function shootClip(page: Page, clip: Rect): Promise<string | undefined> {
  // An element can start left of, or above, the page, and Chromium cannot
  // capture a negative origin: it rejects the whole screenshot, so the picture
  // went missing rather than being trimmed. Clamping keeps what there is.
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
 * Whether a data URI can be embedded as-is.
 *
 * pptxgenjs needs `image/<type>;base64,`. A URL-encoded data URI, which is how
 * an inline SVG icon is usually written, makes it print "Image `data` value
 * lacks a base64 header!" and emit nothing at all. SVG is rasterized on this
 * path regardless, so both cases fall through to a screenshot instead.
 */
export function isUsableDataUri(url: string): boolean {
  return /^data:image\/(?!svg\+xml)[\w.+-]+;base64,/.test(url)
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
    return isUsableDataUri(url) ? url : undefined
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
  /**
   * Captures that asked for isolation and could not find their element.
   *
   * Counted rather than ignored: an isolation that silently does nothing
   * produces a picture with the slide's own text baked into it, which is then
   * drawn again as shapes.
   */
  isolationMissed: number
  fallbackSlides: { no: number, reason: string }[]
}

/**
 * Run every capture through one short, scrollable viewport.
 *
 * Resizing reflows the page, so it happens once around all of them rather than
 * per capture. Boxes are read live inside this viewport, so they stay
 * consistent with it even on a deck the resize does move.
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
      // A pseudo-element has no element to point at, so the page is clipped to
      // the box the walker computed for it instead.
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
        // Could not be fetched, or is an SVG that pptxgenjs would embed with a
        // broken fallback. Either way, a picture of the element is honest.
        //
        // Isolated like any other capture. An `<img>` is mostly transparent
        // whenever it points at an SVG, so without this the picture carried
        // whatever the slide painted behind the icon and drew it a second time
        // on top of the shapes that already say it.
        try {
          if (!(await isolate(page, sourceId, false)))
            report.isolationMissed++
          // Once per ELEMENT, not once per node it produced. One `<img>`
          // showing on several click steps was isolated and screenshotted
          // again for each of them, for the same pixels every time.
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

  await throughShortViewport(page, slides.some(slide => !!slide.fallbackReason), viewportHeight, async () => {
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
        // No picture either. The slide falls back to whatever shapes it has,
        // but `normalize` withheld its raster requests, so its pictures were
        // already dropped. Clearing the reason here hid that: the slide came
        // out gutted and the warning that would have explained it was
        // suppressed.
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
