import type { UnparsedColors } from './color'
import type {
  Border,
  IrBox,
  IrNode,
  IrRun,
  IrText,
  RasterReason,
  RawNode,
  RawSlide,
  RawSnapshot,
  RawStyle,
  Rect,
  SlideIr,
} from './ir'
import { isVisible, parseColor, withOpacity } from './color'

/**
 * `RawSnapshot` to `SlideIr`: every judgement in the exporter, in one pure module with
 * no DOM or Playwright access, so each rule is testable from a hand-written fixture.
 * Where a rule looks over-specific, it is a bug that already happened; see `normalize.test.ts`.
 */

/**
 * Fraction of the slide that may be rasterized before the whole slide falls back to
 * a picture: past this, a half-vector slide invites editing that will not work.
 */
const RASTER_AREA_LIMIT = 0.6

/**
 * Fraction of a line's width kept free so PowerPoint does not re-wrap it: PowerPoint
 * sets the same string a little wider than Chromium, so a shrink-wrapped container
 * gains a wrap. The headroom scales with the line.
 */
const WRAP_HEADROOM = 0.02
const WRAP_HEADROOM_MIN_PX = 4

/** CSS `display` values whose children are laid out, not flowed as text. Prefix match: `table` covers `table-row` and `table-cell`. */
// `list-item` is deliberately absent: a list item flows its children as text,
// and treating it as a layout container fragments `<li>plain <b>bold</b> tail</li>`
// into separate boxes. Its ::marker is emitted before the children are visited.
const LAYOUT_DISPLAY = /^(?:flex|grid|inline-flex|inline-grid|table)/

/**
 * `display` values whose box participates in a line box and whose children flow as
 * text. `inline-flex`, `inline-grid` and `inline-table` are excluded on purpose: they
 * lay their children out as boxes, so a naive `^inline` match would concatenate their cells.
 */
const INLINE_DISPLAY = /^(?:inline(?:-block)?$|contents|ruby)/

const RASTER_TAGS: Record<string, RasterReason> = {
  SVG: 'svg',
  CANVAS: 'canvas',
  VIDEO: 'media',
  AUDIO: 'media',
  IFRAME: 'iframe',
}

export interface RasterRequest {
  /** The `data-slidev-export-id` of the element to capture. */
  sourceId: number
  /** Page coordinates to clip, for a pseudo-element that has no element to select. */
  clip?: Rect
  /** Hide everything outside this element's own subtree. */
  isolate: boolean
  /** Also hide its children, which is only safe when they are redrawn. */
  hideDescendants: boolean
  /** The element to isolate against for a pseudo-element, which has no id attribute of its own; its originating element does. */
  isolateId?: number
}

export interface NormalizeOptions {
  /** Note text per 1-based slide number. */
  notes: Map<number, string | undefined>
}

export interface NormalizeResult {
  slides: SlideIr[]
  rasterRequests: RasterRequest[]
  /** Color strings no parser understood, so the caller can report them. */
  unparsedColors: string[]
}

export function parseLength(value: string | undefined, basis?: number): number {
  if (!value)
    return 0
  const n = Number.parseFloat(value)
  if (Number.isNaN(n))
    return 0
  if (value.trim().endsWith('%'))
    return basis === undefined ? 0 : (n / 100) * basis
  return n
}

/**
 * The part of `rect` on the slide, or undefined. Slides are `overflow: hidden`
 * while PowerPoint has no clipping, so an unclamped shape stays on the canvas off
 * the edge; a rect can also run to tens of millions of pixels.
 */
export function clipToSlide(rect: Rect, size: { w: number, h: number }): Rect | undefined {
  const x = Math.max(rect.x, 0)
  const y = Math.max(rect.y, 0)
  const right = Math.min(rect.x + rect.w, size.w)
  const bottom = Math.min(rect.y + rect.h, size.h)
  if (right <= x || bottom <= y)
    return undefined
  return { x, y, w: right - x, h: bottom - y }
}

/** Whether two rects share any area at all. */
function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

function borderOf(style: RawStyle, side: 'Top' | 'Right' | 'Bottom' | 'Left', unparsed: UnparsedColors): Border | undefined {
  const width = parseLength((style as any)[`border${side}Width`])
  const lineStyle = (style as any)[`border${side}Style`] as string
  const color = parseColor((style as any)[`border${side}Color`], unparsed)
  if (width <= 0 || !lineStyle || lineStyle === 'none' || lineStyle === 'hidden' || !isVisible(color))
    return undefined
  return {
    width,
    color: color!,
    style: lineStyle === 'dashed' ? 'dashed' : lineStyle === 'dotted' ? 'dotted' : 'solid',
  }
}

/**
 * Why this element cannot be drawn as shapes, or undefined if it can. Everything listed
 * lacks a DrawingML primitive; the honest move is one picture at the exact box.
 */
export function rasterReasonFor(node: RawNode, style: RawStyle | undefined): RasterReason | undefined {
  // Before the tag map, which would report a Mermaid diagram as a plain 'svg';
  // the reason reaches the log and the picture's alt text.
  if (node.hasForeignObject)
    return 'foreign-object'
  // Also before the tag map: a formula's root is a `<span>`, so nothing else
  // here would catch it.
  if (node.isMath)
    return 'math'
  const tagReason = RASTER_TAGS[node.tag]
  if (tagReason)
    return tagReason
  if (!style)
    return undefined
  // Before `background-image`, because gradient text is BOTH: a gradient
  // clipped to the glyphs, with `color` left as a flat fallback. Reported as a
  // background image it counts as a backdrop, so the text is drawn again over
  // the picture, and the fallback color hides the gradient it was standing in
  // for.
  if (style.webkitBackgroundClip === 'text')
    return 'background-clip-text'
  if (style.backgroundImage && style.backgroundImage !== 'none')
    return 'background-image'
  if (style.filter && style.filter !== 'none')
    return 'filter'
  if (style.backdropFilter && style.backdropFilter !== 'none')
    return 'backdrop-filter'
  if (style.mixBlendMode && style.mixBlendMode !== 'normal')
    return 'mix-blend-mode'
  if (style.clipPath && style.clipPath !== 'none')
    return 'clip-path'
  if (style.transform && style.transform !== 'none')
    return 'transform'
  if (style.writingMode && style.writingMode !== 'horizontal-tb')
    return 'writing-mode'
  return undefined
}

/**
 * Whether a rasterized element needs its siblings hidden during capture: a backdrop has
 * content painted on top of it, which would bake into the picture and be drawn again as
 * shapes. A leaf such as an `<svg>` has nothing on top.
 */
function needsIsolation(reason: RasterReason): boolean {
  return reason === 'background-image'
    || reason === 'backdrop-filter'
    || reason === 'filter'
    || reason === 'mix-blend-mode'
}

function applyTransform(text: string, transform: string | undefined): string {
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase()
    case 'lowercase':
      return text.toLowerCase()
    case 'capitalize':
      return text.replace(/\b\p{L}/gu, c => c.toUpperCase())
    default:
      return text
  }
}

function resolveLineHeight(style: RawStyle): number {
  const fontSize = parseLength(style.fontSize)
  if (!style.lineHeight || style.lineHeight === 'normal')
    return fontSize * 1.2
  return parseLength(style.lineHeight) || fontSize * 1.2
}

function alignOf(style: RawStyle | undefined): IrText['align'] {
  switch (style?.textAlign) {
    case 'center':
      return 'center'
    case 'right':
    case 'end':
      return 'right'
    case 'justify':
      return 'justify'
    default:
      return 'left'
  }
}

/**
 * CSS keywords rather than typefaces; naming one in the file makes PowerPoint
 * substitute its default silently, so the fallback must skip these as well.
 */
const GENERIC_FAMILIES = new Set([
  'system-ui',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'math',
  'emoji',
  'fangsong',
  'inherit',
  'initial',
  'unset',
])

export function fallbackFamily(stack: string): string {
  for (const raw of stack.split(',')) {
    const family = raw.trim().replace(/^["']|["']$/g, '').replace(/\s+Variable$/, '')
    if (!family || family.startsWith('-') || GENERIC_FAMILIES.has(family.toLowerCase()))
      continue
    return family
  }
  return 'Arial'
}

function runFrom(text: string, style: RawStyle, fontResolution: Record<string, string>, unparsed: UnparsedColors, link?: string, opacity?: number): IrRun {
  const weight = Number(style.fontWeight)
  const decoration = style.textDecorationLine || ''
  const family = fontResolution[style.fontFamily] || fallbackFamily(style.fontFamily)
  const run: IrRun = {
    text: applyTransform(text, style.textTransform),
    fontSize: parseLength(style.fontSize),
    fontFamily: family,
  }
  if (weight >= 600)
    run.bold = true
  if (style.fontStyle === 'italic' || style.fontStyle === 'oblique')
    run.italic = true
  if (decoration.includes('underline'))
    run.underline = true
  if (decoration.includes('line-through'))
    run.strike = true
  const color = withOpacity(parseColor(style.color, unparsed), opacity)
  if (isVisible(color))
    run.color = color
  const spacing = parseLength(style.letterSpacing)
  if (spacing)
    run.letterSpacing = spacing
  if (link)
    run.link = link
  return run
}

function boundsOf(rects: Rect[]): Rect {
  const x = Math.min(...rects.map(r => r.x))
  const y = Math.min(...rects.map(r => r.y))
  return {
    x,
    y,
    w: Math.max(...rects.map(r => r.x + r.w)) - x,
    h: Math.max(...rects.map(r => r.y + r.h)) - y,
  }
}

/**
 * Group glyph rects into line boxes by vertical overlap, not by equal top: runs of
 * different sizes on the same line align on the baseline, so their tops differ, and
 * sub-pixel layout defeats rounding. A shared line overlaps by more than half the shorter rect.
 */
function lineGroups(rects: Rect[]): { top: number, bottom: number }[] {
  const groups: { top: number, bottom: number }[] = []
  for (const rect of [...rects].sort((a, b) => a.y - b.y)) {
    const current = groups[groups.length - 1]
    const overlap = current ? Math.min(current.bottom, rect.y + rect.h) - Math.max(current.top, rect.y) : 0
    if (current && overlap > 0.5 * Math.min(rect.h, current.bottom - current.top)) {
      current.bottom = Math.max(current.bottom, rect.y + rect.h)
      current.top = Math.min(current.top, rect.y)
    }
    else {
      groups.push({ top: rect.y, bottom: rect.y + rect.h })
    }
  }
  return groups
}

function countLines(rects: Rect[]): number {
  return lineGroups(rects).length
}

/**
 * How far apart the browser actually set the lines, or undefined for one line. The computed
 * `line-height` is too small whenever a heading mixes sizes; the median keeps one
 * unusually tall line from stretching the rest.
 */
export function measuredLineHeight(rects: Rect[]): number | undefined {
  const groups = lineGroups(rects)
  if (groups.length < 2)
    return undefined
  const gaps = groups.slice(1).map((group, index) => group.top - groups[index].top)
  gaps.sort((a, b) => a - b)
  const median = gaps[Math.floor(gaps.length / 2)]
  return median > 0 ? median : undefined
}

/**
 * The first non-inset `box-shadow`, as PowerPoint's polar form: an angle and a
 * distance. Multiple shadows and inset shadows have no equivalent and are dropped.
 */
export function parseShadow(value: string | undefined, unparsed?: UnparsedColors): IrBox['shadow'] {
  if (!value || value === 'none' || value.includes('inset'))
    return undefined
  // Any functional color notation; `rgb()` included.
  const color = parseColor(value.match(/^[a-z-]+\([^)]+\)/i)?.[0], unparsed)
  if (!isVisible(color))
    return undefined
  const lengths = [...value.matchAll(/(-?[\d.]+)px/g)].map(m => Number(m[1]))
  if (lengths.length < 2)
    return undefined
  const [x, y, blur = 0] = lengths
  return {
    blur,
    offset: Math.round(Math.hypot(x, y) * 100) / 100,
    // DrawingML measures clockwise from the positive x axis, like CSS's y-down space; no sign flip.
    angle: Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360),
    color: color!,
  }
}

/** One slide's `RawNode` tree to its `IrNode` list. Every helper below closes over the per-slide index and accumulators. */
function buildSlideIr(
  slide: RawSlide,
  styles: RawStyle[],
  fontResolution: Record<string, string>,
  unparsed: UnparsedColors,
): { nodes: IrNode[], requests: RasterRequest[], rasterArea: number, textCount: number } {
  const byId = new Map<number, RawNode>()
  const childIndex = new Map<number, RawNode[]>()
  let nodes: IrNode[] = []
  const requests: RasterRequest[] = []
  let rasterArea = 0
  const pageRects = new Map<number, Rect | undefined>()
  const boxed = new Set<number>()
  /** Paint layer per emitted node, parallel to `nodes`. */
  const layers: { tier: number, z: number }[] = []
  /** Pseudo-element id to the id of the element it belongs to. */
  const originators = new Map<number, number>()
  const size = slide.size

  for (const node of slide.nodes) {
    byId.set(node.id, node)
    const siblings = childIndex.get(node.parent) ?? []
    siblings.push(node)
    childIndex.set(node.parent, siblings)
  }

  /**
   * Where an element paints: CSS puts positioned elements above in-flow content
   * whatever the document order says. Two tiers and a z-index cover what a slide deck actually does.
   */
  function layerOf(node: RawNode): { tier: number, z: number } {
    // The nearest positioned ancestor, not the nearest styled one: a page
    // counter is a positioned `<footer>` wrapping a plain `<div>`.
    let current: RawNode | undefined = node
    while (current) {
      const style = styleOf(current)
      if (style && style.position !== 'static' && style.position !== '') {
        const z = Number.parseInt(style.zIndex, 10)
        return { tier: 1, z: Number.isNaN(z) ? 0 : z }
      }
      current = byId.get(current.parent)
    }
    return { tier: 0, z: 0 }
  }

  function push(node: IrNode, source: RawNode): void {
    nodes.push(node)
    layers.push(layerOf(source))
  }

  function styleOf(node: RawNode): RawStyle | undefined {
    return node.style >= 0 ? styles[node.style] : undefined
  }

  function childrenOf(id: number): RawNode[] {
    return childIndex.get(id) ?? []
  }

  /** The nearest ancestor element's style, which is what styles a text node. */
  function inheritedStyle(node: RawNode): RawStyle | undefined {
    let current: RawNode | undefined = node
    while (current) {
      const style = styleOf(current)
      if (style)
        return style
      current = byId.get(current.parent)
    }
    return undefined
  }

  function linkFor(node: RawNode): string | undefined {
    let current: RawNode | undefined = node
    while (current) {
      if (current.href)
        return current.href
      current = byId.get(current.parent)
    }
    return undefined
  }

  /** Whether an inline element paints something of its own behind its text. */
  function hasDecoration(node: RawNode): boolean {
    const style = styleOf(node)
    if (!style)
      return false
    if (isVisible(withOpacity(parseColor(style.backgroundColor, unparsed), node.opacity)))
      return true
    return (['Top', 'Right', 'Bottom', 'Left'] as const).some(side => borderOf(style, side, unparsed))
  }

  function isInline(node: RawNode): boolean {
    if (node.tag === '#text')
      return true
    const style = styleOf(node)
    return !!style && INLINE_DISPLAY.test(style.display)
  }

  function run(): { nodes: IrNode[], requests: RasterRequest[], rasterArea: number, textCount: number } {
    for (const root of childrenOf(-1))
      visit(root)

    // Everything downstream treats array order as paint order, so reorder into
    // CSS paint order first; a stable sort keeps document order within a layer.
    const order = nodes.map((node, index) => ({ node, index, layer: layers[index] }))
    order.sort((a, b) =>
      a.layer.tier - b.layer.tier || a.layer.z - b.layer.z || a.index - b.index)
    nodes = order.map(entry => entry.node)

    const texts = nodes.filter(n => n.kind === 'text')
    // Picture over picture is not the doubling problem below: each is drawn from its own screenshot.
    const drawnOver = nodes.filter(n => n.kind === 'text' || n.kind === 'image')

    for (const node of nodes) {
      if (node.kind !== 'raster')
        continue

      // `locator.screenshot()` clips the page rather than isolating, so
      // anything also drawn as a shape inside this picture's box would print
      // twice. Overlap tests that directly; the CSS reason was only a proxy.
      const covered = drawnOver.some(other => overlaps(other.rect, node.rect))
      if (covered)
        node.isolate = true

      requests.push({
        sourceId: node.sourceId,
        isolate: node.isolate,
        hideDescendants: node.hideDescendants,
        clip: pageRects.get(node.sourceId),
        isolateId: originators.get(node.sourceId),
      })

      // Count only raster area with no editable text over it: a cover photo
      // covers the whole slide by definition while its title vectorizes
      // perfectly, and counting those sent every cover slide to the fallback.
      if (texts.some(text => overlaps(text.rect, node.rect)))
        continue
      const visible = clipToSlide(node.rect, size)
      if (visible)
        rasterArea += visible.w * visible.h
    }

    return { nodes, requests, rasterArea, textCount: texts.length }
  }

  /** Whether a picture was actually emitted for this element. */
  function emitRaster(node: RawNode, reason: RasterReason): boolean {
    // A pseudo-element has no DOM node to screenshot, so it alone is captured
    // by clipping the page at coordinates measured here; everything else is
    // captured from its box read live at capture time, which cannot be stale.
    if (node.tag === '::BEFORE' || node.tag === '::AFTER') {
      pageRects.set(node.id, node.pageRect)
      originators.set(node.id, node.parent)
    }
    const isolate = needsIsolation(reason)
    const visible = clipToSlide(node.rect, size)
    if (!visible)
      return false
    // An element that runs past the slide is captured as a page clip and
    // placed at that same clipped rectangle so the picture is not squashed.
    // Screenshotting it whole can ask Chromium to rasterize tens of millions
    // of pixels, which kills the renderer.
    const overflows = visible.w !== node.rect.w || visible.h !== node.rect.h
    if (overflows && node.pageRect) {
      pageRects.set(node.id, {
        x: node.pageRect.x + (visible.x - node.rect.x),
        y: node.pageRect.y + (visible.y - node.rect.y),
        w: visible.w,
        h: visible.h,
      })
    }

    push({
      kind: 'raster',
      sourceId: node.id,
      // Children are walked and redrawn only for a backdrop; only then is hiding them safe.
      hideDescendants: isolate,
      rect: overflows ? visible : node.rect,
      data: '',
      reason,
      isolate,
    }, node)
    return true
  }

  function emitImage(node: RawNode): void {
    if (!node.src)
      return
    // Clipped like every other shape, or a partly off-slide image lands outside the canvas.
    const rect = clipToSlide(node.rect, size)
    if (!rect)
      return
    // Show the visible part of an oversized image and crop the rest, as
    // `overflow: hidden` does; scaling it to fit would compress it.
    const clipped = rect.w !== node.rect.w || rect.h !== node.rect.h
    push({
      kind: 'image',
      sourceId: node.id,
      rect,
      data: node.src,
      alt: node.alt,
      link: linkFor(node),
      ...(clipped
        ? {
            crop: {
              x: rect.x - node.rect.x,
              y: rect.y - node.rect.y,
              w: node.rect.w,
              h: node.rect.h,
            },
          }
        : {}),
    }, node)
  }

  function emitBox(node: RawNode, style: RawStyle): void {
    // `emitTextGroup` and `visit` can both reach the same node; two
    // translucent fills would composite visibly darker.
    if (boxed.has(node.id))
      return
    boxed.add(node.id)
    const fill = withOpacity(parseColor(style.backgroundColor, unparsed), node.opacity)
    const borders: [Border?, Border?, Border?, Border?] = [
      borderOf(style, 'Top', unparsed),
      borderOf(style, 'Right', unparsed),
      borderOf(style, 'Bottom', unparsed),
      borderOf(style, 'Left', unparsed),
    ]
    const hasBorder = borders.some(Boolean)
    // Chromium keeps `border-radius` percentages in the computed value, so a
    // basis is needed: `border-radius: 50%` on a 200px box is 100px, not 50px.
    const radius = parseLength(style.borderTopLeftRadius, Math.min(node.rect.w, node.rect.h))
    if (!isVisible(fill) && !hasBorder)
      return
    const shadow = parseShadow(style.boxShadow, unparsed)
    // One shape per line fragment for a wrapped inline element, as the browser
    // paints; one rect over the union would fill the ragged line ends.
    const boxes = node.fragments?.length ? node.fragments : [node.rect]
    for (const source of boxes) {
      const rect = clipToSlide(source, size)
      if (!rect)
        continue
      const box: IrBox = { kind: 'box', sourceId: node.id, rect }
      if (isVisible(fill))
        box.fill = fill
      if (hasBorder)
        box.borders = borders
      if (radius > 0)
        box.radius = radius
      if (shadow)
        box.shadow = shadow
      push(box, node)
    }
  }

  function visit(node: RawNode): void {
    // A pseudo-element paints either an image or a short string, and has no children.
    if (node.tag === '::BEFORE' || node.tag === '::AFTER') {
      const style = styleOf(node)
      if (!style)
        return
      const reason = rasterReasonFor(node, style)
      if (reason && emitRaster(node, reason))
        return
      emitBox(node, style)
      if (node.text) {
        push({
          kind: 'text',
          sourceId: node.id,
          rect: node.rect,
          elementRect: node.rect,
          lineCount: 1,
          align: alignOf(style),
          valign: 'middle',
          lineHeight: resolveLineHeight(style),
          runs: [runFrom(node.text, style, fontResolution, unparsed)],
        }, node)
      }
      return
    }

    if (node.tag === '#text') {
      // Reached only when a text node has no block container of its own; guarded so a stray one is not lost.
      emitTextGroup([node])
      return
    }

    const style = styleOf(node)
    const reason = rasterReasonFor(node, style)
    // Treat the element as rasterized only when a picture was actually placed:
    // a zero-sized wrapper has no box of its own while its positioned
    // descendants do, and dropping the subtree would lose them.
    if (reason && emitRaster(node, reason)) {
      // A leaf such as an <svg> has no shapes worth recovering underneath it;
      // a backdrop does, its children being drawn on top of the isolated picture.
      if (!needsIsolation(reason))
        return
      // But not its own box: the screenshot already contains this element's
      // background and borders, so drawing them again composites twice.
      visitChildren(node)
      return
    }

    if (style)
      emitBox(node, style)

    if (node.tag === 'IMG') {
      emitImage(node)
      return
    }

    // A ::marker is a pseudo-element: the bullet glyph has no text node, so a
    // plain walk drops every bullet in the deck.
    if (node.marker && style) {
      const markerRect: Rect = {
        x: Math.max(0, node.rect.x - parseLength(style.fontSize) * 1.2),
        y: node.rect.y,
        w: parseLength(style.fontSize) * 1.2,
        h: resolveLineHeight(style),
      }
      push({
        kind: 'text',
        sourceId: node.id,
        rect: markerRect,
        elementRect: markerRect,
        lineCount: 1,
        align: 'left',
        // Centered in the line box, where a browser puts a marker; anchored to
        // the top it rides above its own item's first line.
        valign: 'middle',
        lineHeight: resolveLineHeight(style),
        runs: [runFrom(node.marker, style, fontResolution, unparsed, undefined, node.opacity)],
      }, node)
    }

    visitChildren(node)
  }

  function visitChildren(node: RawNode): void {
    const style = styleOf(node)
    const children = childrenOf(node.id)
    if (!children.length)
      return

    // A grid or flex container lays its children out as boxes; grouping them
    // as one run of text concatenates unrelated cells.
    if (style && LAYOUT_DISPLAY.test(style.display)) {
      for (const child of children)
        visit(child)
      return
    }

    // Consecutive inline children form one anonymous block box, which is one
    // text box; one shape each would lay out from the same origin and overlap.
    let group: RawNode[] = []
    const flush = () => {
      if (group.length) {
        emitTextGroup(group)
        group = []
      }
    }
    for (const child of children) {
      if (isInline(child)) {
        // An inline element carrying its own background or border is a chip: its
        // decoration is a positioned shape, so its label gets its own text box anchored
        // to the glyph bounds, keeping metric differences from sliding the label off
        // the chip. Only when it is the whole of its container: Slidev styles inline
        // `<code>` with a background, and an unconditional split overlaps a wrapped sentence.
        if (hasDecoration(child) && children.length === 1) {
          flush()
          emitTextGroup([child])
          continue
        }
        group.push(child)
      }
      else {
        flush()
        visit(child)
      }
    }
    flush()
  }

  /** Every text node under an inline subtree, in document order. */
  function collectText(node: RawNode, out: RawNode[]): void {
    if (node.tag === '#text') {
      out.push(node)
      return
    }
    const style = styleOf(node)
    const reason = rasterReasonFor(node, style)
    // An inline <svg> icon still becomes a picture, but only if it has a box;
    // otherwise its subtree is walked as usual rather than dropped.
    if (reason && emitRaster(node, reason))
      return
    // A <br> has no text node of its own, so without this marker the text on
    // either side of it concatenates with no break.
    if (node.tag === 'BR') {
      out.push(node)
      return
    }
    // An inline <img> reaches here rather than `visit`; drawn at its measured box.
    if (node.tag === 'IMG') {
      emitImage(node)
      return
    }
    // A layout container nested inside an inline run still lays out boxes.
    if (style && LAYOUT_DISPLAY.test(style.display)) {
      visit(node)
      return
    }
    for (const child of childrenOf(node.id))
      collectText(child, out)
  }

  function emitTextGroup(group: RawNode[]): void {
    // Inline decorations first: paint order is array order, so a chip emitted
    // after its label would cover it.
    for (const node of group) {
      if (node.tag === '#text')
        continue
      // The group node itself too: the chip is usually the outermost inline element in the group.
      const own = styleOf(node)
      if (own)
        emitBox(node, own)
      forEachDescendant(node, (descendant) => {
        const style = styleOf(descendant)
        if (style)
          emitBox(descendant, style)
      })
    }

    const textNodes: RawNode[] = []
    for (const node of group)
      collectText(node, textNodes)
    if (!textNodes.length)
      return

    const runs: IrRun[] = []
    const rects: Rect[] = []

    /**
     * Line breaks waiting for the next run; a count, since two consecutive `<br>` need an
     * empty run between them. Held against the next run so a trailing break does not add an empty last line.
     */
    let pendingBreaks = 0

    const addRun = (text: string, style: RawStyle, node: RawNode) => {
      // One empty run per surplus break, so the blank lines survive.
      while (pendingBreaks > 1 && runs.length) {
        runs.push({ ...runFrom('', style, fontResolution, unparsed, undefined, node.opacity), breakBefore: true })
        pendingBreaks--
      }
      const newRun = runFrom(text, style, fontResolution, unparsed, linkFor(node), node.opacity)
      if (pendingBreaks && runs.length)
        newRun.breakBefore = true
      pendingBreaks = 0
      runs.push(newRun)
    }

    for (const textNode of textNodes) {
      if (textNode.tag === 'BR') {
        pendingBreaks++
        continue
      }
      const style = inheritedStyle(textNode)
      if (!style)
        continue
      const raw = textNode.text ?? ''
      if (!raw)
        continue

      // `white-space: pre` keeps its newlines, the only record of where a code
      // block's lines end: Shiki separates line spans with "\n" text nodes, so
      // folding them into spaces re-wraps the block into one paragraph.
      if (style.whiteSpace.startsWith('pre')) {
        const lines = raw.split('\n')
        lines.forEach((line, index) => {
          if (index > 0)
            pendingBreaks++
          if (line)
            addRun(line, style, textNode)
        })
        rects.push(...(textNode.glyphRects ?? []))
        continue
      }

      const text = raw.replace(/\s+/g, ' ')
      if (!text.trim()) {
        // A whitespace-only node is the space between two inline elements;
        // folded into the previous run so it keeps no styling of its own.
        if (runs.length && !runs[runs.length - 1].text.endsWith(' '))
          runs[runs.length - 1].text += ' '
        continue
      }
      addRun(text, style, textNode)
      rects.push(...(textNode.glyphRects ?? [textNode.rect]))
    }
    if (!runs.length || !rects.length)
      return

    // Whitespace at line boundaries collapses in the browser but survives the
    // fold above and shifts a centered line by half a space. Every line
    // boundary counts, not just the box edges: a run after a break opens a new line.
    runs.forEach((run, index) => {
      const opensLine = index === 0 || run.breakBefore
      const closesLine = index === runs.length - 1 || runs[index + 1]?.breakBefore
      if (opensLine)
        run.text = run.text.replace(/^ +/, '')
      if (closesLine)
        run.text = run.text.replace(/ +$/, '')
    })

    const container = byId.get(group[0].parent)
    const containerStyle = container ? styleOf(container) : undefined
    const anchorStyle = containerStyle ?? inheritedStyle(textNodes[0])!

    const glyphs = boundsOf(rects)
    const lineCount = countLines(rects)

    /**
     * The box PowerPoint will wrap inside. Wrapped text's glyph bounds are the width of
     * the longest line, which guarantees a second, tighter wrap; the browser wrapped
     * against the container's content box, so reproduce that. Single-line text keeps its exact glyph bounds.
     */
    let rect = glyphs
    let align = alignOf(anchorStyle)

    /** Widen a box that has no room for PowerPoint's wider metrics. */
    const withHeadroom = (box: Rect): Rect => {
      const headroom = box.w - glyphs.w
      const wanted = Math.max(WRAP_HEADROOM_MIN_PX, glyphs.w * WRAP_HEADROOM)
      if (headroom >= wanted)
        return box
      const extra = wanted - Math.max(0, headroom)
      // Grown about the anchor, so the text does not slide sideways.
      const x = align === 'center'
        ? box.x - extra / 2
        : align === 'right' ? box.x - extra : box.x
      return { x, y: box.y, w: box.w + extra, h: box.h }
    }
    let valign: IrText['valign']

    /**
     * A chip label is pinned to its chip's box and centered there, keeping the inset even
     * however the font measures; positioned from the glyphs it ends hard against one edge
     * as soon as PowerPoint sets the string wider.
     */
    const decorated = group.length === 1 && group[0].tag !== '#text' && hasDecoration(group[0])
    if (decorated) {
      rect = group[0].rect
      align = 'center'
      valign = 'middle'
    }
    else if (lineCount > 1 && container && containerStyle) {
      const left = parseLength(containerStyle.paddingLeft)
      const right = parseLength(containerStyle.paddingRight)
      const width = container.rect.w - left - right
      if (width > 0) {
        rect = withHeadroom({ x: container.rect.x + left, y: glyphs.y, w: width, h: glyphs.h })
      }
    }

    // Clipped like every other node, or browser-clipped text lands off the
    // canvas while still suppressing the whole-slide fallback.
    if (!clipToSlide(rect, size))
      return

    push({
      kind: 'text',
      sourceId: group[0].id,
      rect,
      elementRect: container?.rect ?? glyphs,
      lineCount,
      align,
      valign,
      lineHeight: measuredLineHeight(rects) ?? resolveLineHeight(anchorStyle),
      runs,
    }, group[0])
  }

  function forEachDescendant(node: RawNode, fn: (node: RawNode) => void): void {
    for (const child of childrenOf(node.id)) {
      if (child.tag !== '#text')
        fn(child)
      forEachDescendant(child, fn)
    }
  }

  return run()
}

export function normalize(snapshot: RawSnapshot, options: NormalizeOptions): NormalizeResult {
  const unparsedColors = new Set<string>()
  const slides: SlideIr[] = []
  const rasterRequests: RasterRequest[] = []

  for (const raw of snapshot.slides) {
    const { nodes, requests, rasterArea, textCount } = buildSlideIr(raw, snapshot.styles, snapshot.fontResolution, unparsedColors)

    const ir: SlideIr = {
      no: raw.no,
      clickIndex: raw.clickIndex,
      containerId: raw.containerId,
      size: raw.size,
      // Without the slide's own background, a dark theme exports as light text
      // on PowerPoint's default white.
      background: parseColor(raw.background, unparsedColors),
      nodes,
      note: options.notes.get(raw.no),
    }

    const slideArea = raw.size.w * raw.size.h
    const hasSourceText = raw.nodes.some(n => n.tag === '#text' && (n.text ?? '').trim())

    // Both conditions describe a slide where vectorizing produced something
    // worse than the picture it replaced; degrade to what `--format pptx` does.
    if (hasSourceText && textCount === 0) {
      ir.fallbackReason = 'no text could be recovered from a slide that has text'
    }
    else if (slideArea > 0 && rasterArea / slideArea > RASTER_AREA_LIMIT) {
      // Capped: rasters can overlap, so the raw sum can exceed the slide.
      const percent = Math.min(100, Math.round((rasterArea / slideArea) * 100))
      ir.fallbackReason = `${percent}% of the slide had to be rasterized`
    }

    if (!ir.fallbackReason)
      rasterRequests.push(...requests)

    slides.push(ir)
  }

  return { slides, rasterRequests, unparsedColors: [...unparsedColors].sort() }
}
