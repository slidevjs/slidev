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
  Rgba,
  SlideIr,
} from './ir'

/**
 * `RawSnapshot` to `SlideIr`: every judgement in the exporter, in one pure
 * module.
 *
 * Nothing here touches the DOM or Playwright, so each rule is testable by
 * writing a fixture by hand. That is the entire reason the walker was kept
 * dumb: the interesting decisions are the ones that get them wrong, and a
 * decision made inside `page.evaluate` cannot be tested at all.
 *
 * Where a rule below looks over-specific, it is because it is a bug that
 * already happened. See the named cases in `normalize.test.ts`.
 */

/**
 * Fraction of the slide that may be rasterized before vectorizing is judged
 * pointless and the whole slide falls back to a picture.
 *
 * Past this point the file is mostly images anyway, and a half-vector slide is
 * worse than an honest one: it invites editing that will not work.
 */
const RASTER_AREA_LIMIT = 0.6

/**
 * Fraction of a line's width kept free so PowerPoint does not re-wrap it.
 *
 * PowerPoint sets the same string a little wider than Chromium does. When a
 * container shrink-wraps its text there is no room for that difference, so the
 * longest line wraps and the block gains a line nobody asked for. The headroom
 * has to scale with the line: a fixed couple of pixels is nothing on a 500px
 * line of display type.
 */
const WRAP_HEADROOM = 0.02
const WRAP_HEADROOM_MIN_PX = 4

/** CSS `display` values whose children are laid out, not flowed as text. */
// Prefix match, so `table` already covers `table-row` and `table-cell`.
//
// `list-item` is deliberately ABSENT. A list item flows its children as text
// like any block, and treating it as a layout container fragmented
// `<li>plain <b>bold</b> tail</li>` into four separate boxes, which is the
// trap-7 bug on the commonest slide content there is. Its ::marker is emitted
// before the children are visited, so it needs no help from this list.
const LAYOUT_DISPLAY = /^(?:flex|grid|inline-flex|inline-grid|table)/

/**
 * CSS `display` values whose box participates in a line box AND whose children
 * flow as text.
 *
 * `inline-flex`, `inline-grid` and `inline-table` are excluded on purpose.
 * They are inline-LEVEL, so a naive `^inline` match calls them inline and the
 * text walk descends through them, concatenating their cells: the exact
 * "Left cellRight cell" bug that LAYOUT_DISPLAY exists to prevent, one
 * display value over. Badges and stat rows are commonly built this way.
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
  /**
   * Page coordinates to clip instead of targeting a locator.
   *
   * Set for a pseudo-element, which has no element to select.
   */
  clip?: Rect
  /** Hide everything outside this element's own subtree. */
  isolate: boolean
  /** Also hide its children, which is only safe when they are redrawn. */
  hideDescendants: boolean
  /**
   * The element to isolate against, when it is not the captured node itself.
   *
   * A pseudo-element has no DOM node and so no id attribute to find, but its
   * originating element does, and hiding that element's siblings is what keeps
   * the surrounding slide out of the clip.
   */
  isolateId?: number
}

export interface NormalizeOptions {
  /** Note text per 1-based slide number. */
  notes: Map<number, string | undefined>
}

export interface NormalizeResult {
  slides: SlideIr[]
  rasterRequests: RasterRequest[]
  /** Colour strings no parser understood, so the caller can report them. */
  unparsedColors: string[]
}

// ---------------------------------------------------------------------------
// Value parsing
// ---------------------------------------------------------------------------

/**
 * Colour strings no parser understood, for the current `normalize()` call.
 *
 * Reset at the start of every run rather than drained by the caller: drained
 * state leaks into the next export whenever the current one throws before the
 * caller gets to it, and this module claims to be pure.
 */
let unparsedColors = new Set<string>()

function numbers(body: string): number[] {
  return body.split(/[\s,/]+/).filter(Boolean).map((token) => {
    const n = Number.parseFloat(token)
    return token.endsWith('%') ? n / 100 : n
  })
}

function srgbChannel(v: number): number {
  // The sRGB transfer function, for converting linear light back to 0-255.
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055
  return Math.max(0, Math.min(255, Math.round(c * 255)))
}

/** Oklab to sRGB, per the CSS Color 4 conversion. */
function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
  return [
    srgbChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    srgbChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    srgbChannel(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ]
}

function hueToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  const [r, g, b]
    = hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x]
  const m = l - c / 2
  const to255 = (v: number) => Math.max(0, Math.min(255, Math.round((v + m) * 255)))
  return [to255(r), to255(g), to255(b)]
}

/**
 * A computed CSS colour, in any syntax Chromium actually serializes.
 *
 * `rgb()` covers Slidev's own UnoCSS output, but a theme authored in modern
 * syntax keeps `oklch()`, `color()` or `hsl()` in the computed value, and
 * returning undefined for those silently drops every fill, border and text
 * colour on the slide with nothing in the log to explain it.
 */
export function parseColor(value: string | undefined): Rgba | undefined {
  if (!value)
    return undefined
  const text = value.trim()
  if (text === 'transparent')
    return { r: 0, g: 0, b: 0, a: 0 }

  const fn = text.match(/^([a-z-]+)\(([^)]+)\)$/i)
  if (!fn) {
    unparsedColors.add(text)
    return undefined
  }
  const name = fn[1].toLowerCase()

  if (name === 'color') {
    // Handled before the numeric guard: the first token is a colour space
    // name, so parsing the whole body as numbers yields NaN and would reject
    // every `color()` value outright.
    const tokens = fn[2].trim().split(/[\s,/]+/).filter(Boolean)
    const channels = numbers(tokens.slice(1).join(' '))
    if (tokens[0] === 'srgb' && channels.length >= 3 && !channels.slice(0, 3).some(Number.isNaN)) {
      return {
        r: Math.round(channels[0] * 255),
        g: Math.round(channels[1] * 255),
        b: Math.round(channels[2] * 255),
        a: channels.length > 3 && !Number.isNaN(channels[3]) ? channels[3] : 1,
      }
    }
    unparsedColors.add(text)
    return undefined
  }

  const parts = numbers(fn[2])
  if (parts.some(Number.isNaN)) {
    unparsedColors.add(text)
    return undefined
  }
  const alpha = (index: number) => (parts.length > index ? parts[index] : 1)

  if (name === 'rgb' || name === 'rgba') {
    if (parts.length < 3)
      return undefined
    // Percentage channels were divided by 100 above, so scale them back.
    const channel = (v: number, raw: string) => (raw.includes('%') ? v * 255 : v)
    const raw = fn[2].split(/[\s,/]+/).filter(Boolean)
    return {
      r: channel(parts[0], raw[0] ?? ''),
      g: channel(parts[1], raw[1] ?? ''),
      b: channel(parts[2], raw[2] ?? ''),
      a: alpha(3),
    }
  }

  if (name === 'hsl' || name === 'hsla') {
    if (parts.length < 3)
      return undefined
    const [r, g, b] = hueToRgb(parts[0], parts[1], parts[2])
    return { r, g, b, a: alpha(3) }
  }

  if (name === 'oklch' || name === 'oklab') {
    if (parts.length < 3)
      return undefined
    const L = parts[0]
    const [a, b] = name === 'oklch'
      ? [parts[1] * Math.cos((parts[2] * Math.PI) / 180), parts[1] * Math.sin((parts[2] * Math.PI) / 180)]
      : [parts[1], parts[2]]
    const [r, g, bb] = oklabToRgb(L, a, b)
    return { r, g, b: bb, a: alpha(3) }
  }

  unparsedColors.add(text)
  return undefined
}

/**
 * A CSS length in pixels.
 *
 * `basis` resolves a percentage. Chromium keeps `border-radius` as a
 * percentage in the computed value rather than resolving it, so a plain
 * `parseFloat` turns `border-radius: 50%` on a 200px box into 50px instead of
 * 100px, and the corners come out barely rounded.
 */
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
 * The part of `rect` that is actually on the slide, or undefined if none is.
 *
 * A slide container is `overflow: hidden`, so anything outside it is invisible
 * to the audience. PowerPoint has no clipping: an unclamped shape stays on the
 * canvas, off the edge, where it is both wrong and impossible to select.
 *
 * This also keeps the tier-4 area accounting sane. Slidev's own starter deck
 * has an element whose rect runs to tens of millions of pixels, which reported
 * a slide as "104064986954% rasterized" before the clamp existed.
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

function isVisible(color: Rgba | undefined): boolean {
  return !!color && color.a > 0
}

/**
 * Fold an element's effective opacity into a colour's own alpha.
 *
 * DrawingML has no element-level opacity and no group opacity, only per-fill
 * alpha, so an `opacity: 0.5` overlay exported fully opaque and hid whatever
 * sat behind it. The value is compounded down the tree by the walker, because
 * CSS `opacity` does not inherit: a child of a half-transparent wrapper
 * computes 1 and would otherwise export at full strength.
 */
function withOpacity(color: Rgba | undefined, opacity: number | undefined): Rgba | undefined {
  if (!color)
    return undefined
  if (opacity === undefined || !Number.isFinite(opacity) || opacity >= 1)
    return color
  return { ...color, a: color.a * Math.max(0, opacity) }
}

function borderOf(style: RawStyle, side: 'Top' | 'Right' | 'Bottom' | 'Left'): Border | undefined {
  const width = parseLength((style as any)[`border${side}Width`])
  const lineStyle = (style as any)[`border${side}Style`] as string
  const color = parseColor((style as any)[`border${side}Color`])
  if (width <= 0 || !lineStyle || lineStyle === 'none' || lineStyle === 'hidden' || !isVisible(color))
    return undefined
  return {
    width,
    color: color!,
    style: lineStyle === 'dashed' ? 'dashed' : lineStyle === 'dotted' ? 'dotted' : 'solid',
  }
}

/**
 * Why this element cannot be drawn as shapes, or undefined if it can.
 *
 * Everything listed here is something DrawingML has no primitive for. The
 * honest move is one picture of that element at its exact box, rather than an
 * approximation that looks nearly right and cannot be edited back.
 */
export function rasterReasonFor(node: RawNode, style: RawStyle | undefined): RasterReason | undefined {
  // Checked BEFORE the tag map, which would otherwise report a mermaid diagram
  // as a plain 'svg'. Both rasterize, but the reason reaches the log and the
  // picture's alt text, and "its labels are foreignObject HTML" is the useful
  // diagnosis for something that looks like vector art and is not.
  if (node.hasForeignObject)
    return 'foreign-object'
  const tagReason = RASTER_TAGS[node.tag]
  if (tagReason)
    return tagReason
  if (!style)
    return undefined
  if (style.backgroundImage && style.backgroundImage !== 'none')
    return 'background-image'
  if (style.webkitBackgroundClip === 'text')
    return 'background-clip-text'
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
 * Whether a rasterized element needs its siblings hidden during capture.
 *
 * A backdrop has content painted on top of it. `locator.screenshot()` clips
 * the page to the element's box rather than isolating the element, so without
 * hiding siblings the content bakes into the backdrop picture AND is drawn
 * again as shapes, doubling every word on the slide.
 *
 * A leaf such as an `<svg>` or an `<iframe>` has nothing on top of it, so
 * isolating it would only cost a DOM mutation.
 */
function needsIsolation(reason: RasterReason): boolean {
  return reason === 'background-image'
    || reason === 'backdrop-filter'
    || reason === 'filter'
    || reason === 'mix-blend-mode'
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

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
 * CSS keywords rather than typefaces. Naming one asks PowerPoint for a font
 * that exists nowhere, so it substitutes its own default silently.
 *
 * The walker already skips these when probing, but when NOTHING in a stack
 * resolves it reports an empty string, and falling back to the head of the
 * stack put `system-ui` straight back into the file.
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

function runFrom(text: string, style: RawStyle, fontResolution: Record<string, string>, link?: string, opacity?: number): IrRun {
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
  const color = withOpacity(parseColor(style.color), opacity)
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
 * Distinct line boxes, which is the only reliable line count available.
 *
 * Grouped with a tolerance rather than by rounding. Sub-pixel layout puts
 * fragments of the same visual line at 10.4 and 10.6, which round to different
 * integers and report one line as two. That flips `wrap` in the builder, which
 * is the exact decision this number exists to make.
 */
/**
 * Group glyph rects into line boxes by vertical OVERLAP.
 *
 * Not by equal top: runs of different sizes on the SAME line have different
 * tops, because a browser aligns them on the shared baseline. A heading
 * reading `Needed a **Pros-Cons comparison** in now?` therefore counted four
 * lines where it has two, and the line spacing derived from that count stacked
 * its two real lines on top of each other.
 *
 * Two rects share a line when they overlap by more than half the shorter one,
 * which distinguishes a small run sitting inside a large one from the couple
 * of pixels of ink that adjacent lines can share when leading is tight.
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
 * How far apart the browser actually set the lines, or undefined for one line.
 *
 * The computed `line-height` belongs to the element, while a line box is as
 * tall as the largest run ON that line. Where those disagree, and they do
 * whenever a heading mixes sizes, the computed value is far too small and
 * PowerPoint sets the lines overlapping. The median keeps one unusually tall
 * line, such as one carrying an inline image, from stretching the rest.
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
 * The first non-inset `box-shadow`, as PowerPoint's polar form.
 *
 * CSS gives an x/y offset; DrawingML wants an angle and a distance. Multiple
 * shadows and inset shadows have no equivalent and are dropped.
 */
export function parseShadow(value: string | undefined): IrBox['shadow'] {
  if (!value || value === 'none' || value.includes('inset'))
    return undefined
  // Any functional colour notation; `rgb()` is already covered by this.
  const color = parseColor(value.match(/^[a-z-]+\([^)]+\)/i)?.[0])
  if (!isVisible(color))
    return undefined
  const lengths = [...value.matchAll(/(-?[\d.]+)px/g)].map(m => Number(m[1]))
  if (lengths.length < 2)
    return undefined
  const [x, y, blur = 0] = lengths
  return {
    blur,
    offset: Math.round(Math.hypot(x, y) * 100) / 100,
    // DrawingML measures clockwise from the positive x axis, like CSS's y-down
    // coordinate space, so no sign flip is needed.
    angle: Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360),
    color: color!,
  }
}

// ---------------------------------------------------------------------------
// The walk
// ---------------------------------------------------------------------------

class SlideWalker {
  private byId = new Map<number, RawNode>()
  private children = new Map<number, RawNode[]>()
  private nodes: IrNode[] = []
  private requests: RasterRequest[] = []
  private rasterArea = 0
  private pageRects = new Map<number, Rect | undefined>()
  private boxed = new Set<number>()
  /** Paint layer per emitted node, parallel to `nodes`. */
  private layers: { tier: number, z: number }[] = []
  /** Pseudo-element id to the id of the element it belongs to. */
  private originators = new Map<number, number>()
  private size: { w: number, h: number }

  constructor(
    slide: RawSlide,
    private styles: RawStyle[],
    private fontResolution: Record<string, string>,
  ) {
    this.size = slide.size
    for (const node of slide.nodes) {
      this.byId.set(node.id, node)
      const siblings = this.children.get(node.parent) ?? []
      siblings.push(node)
      this.children.set(node.parent, siblings)
    }
  }

  /**
   * Where an element paints, rather than where it sits in the tree.
   *
   * CSS paints positioned elements ABOVE in-flow content whatever the document
   * order says. A slide's page counter is the first child of its container and
   * is `position: absolute`, so a full-bleed background further down the tree
   * covered it completely when paint order was taken to be array order.
   *
   * Two tiers and a z-index is not the full stacking algorithm, which also has
   * negative layers, stacking contexts and floats, but it covers what a slide
   * deck actually does.
   */
  private layerOf(node: RawNode): { tier: number, z: number } {
    // The NEAREST POSITIONED ANCESTOR, not the nearest styled one. A page
    // counter is a positioned `<footer>` wrapping a plain `<div>`, and reading
    // the div alone called the whole thing in-flow, so it kept painting
    // underneath the background it is supposed to sit on.
    let current: RawNode | undefined = node
    while (current) {
      const style = this.styleOf(current)
      if (style && style.position !== 'static' && style.position !== '') {
        const z = Number.parseInt(style.zIndex, 10)
        return { tier: 1, z: Number.isNaN(z) ? 0 : z }
      }
      current = this.byId.get(current.parent)
    }
    return { tier: 0, z: 0 }
  }

  private push(node: IrNode, source: RawNode): void {
    this.nodes.push(node)
    this.layers.push(this.layerOf(source))
  }

  private styleOf(node: RawNode): RawStyle | undefined {
    return node.style >= 0 ? this.styles[node.style] : undefined
  }

  private childrenOf(id: number): RawNode[] {
    return this.children.get(id) ?? []
  }

  /** The nearest ancestor element's style, which is what styles a text node. */
  private inheritedStyle(node: RawNode): RawStyle | undefined {
    let current: RawNode | undefined = node
    while (current) {
      const style = this.styleOf(current)
      if (style)
        return style
      current = this.byId.get(current.parent)
    }
    return undefined
  }

  private linkFor(node: RawNode): string | undefined {
    let current: RawNode | undefined = node
    while (current) {
      if (current.href)
        return current.href
      current = this.byId.get(current.parent)
    }
    return undefined
  }

  /** Whether an inline element paints something of its own behind its text. */
  private hasDecoration(node: RawNode): boolean {
    const style = this.styleOf(node)
    if (!style)
      return false
    if (isVisible(withOpacity(parseColor(style.backgroundColor), node.opacity)))
      return true
    return (['Top', 'Right', 'Bottom', 'Left'] as const).some(side => borderOf(style, side))
  }

  private isInline(node: RawNode): boolean {
    if (node.tag === '#text')
      return true
    const style = this.styleOf(node)
    return !!style && INLINE_DISPLAY.test(style.display)
  }

  run(): { nodes: IrNode[], requests: RasterRequest[], rasterArea: number, textCount: number } {
    for (const root of this.childrenOf(-1))
      this.visit(root)

    // Reordered into CSS paint order before anything reads the array, since
    // everything downstream, including the overlap tests below and the
    // builder, treats array order as paint order. A stable sort keeps document
    // order within a layer, which is what CSS does too.
    const order = this.nodes.map((node, index) => ({ node, index, layer: this.layers[index] }))
    order.sort((a, b) =>
      a.layer.tier - b.layer.tier || a.layer.z - b.layer.z || a.index - b.index)
    this.nodes = order.map(entry => entry.node)

    const texts = this.nodes.filter(n => n.kind === 'text')
    // Pictures are drawn from their own screenshots, so a picture overlapping
    // another picture is not the doubling problem below.
    const drawnOver = this.nodes.filter(n => n.kind === 'text' || n.kind === 'image')

    for (const node of this.nodes) {
      if (node.kind !== 'raster')
        continue

      /**
       * Anything we ALSO draw as a shape inside this picture's box.
       *
       * `locator.screenshot()` clips the page to the element's box rather than
       * isolating the element, so every overlapping thing lands in the
       * picture. Drawing it again as a shape then prints it twice, which is
       * exactly what a cover title over a full-bleed graphic looked like.
       *
       * Isolation used to be decided from the CSS reason - backdrops and the
       * filter family - but that was only ever a proxy for "something is
       * painted on top of this". Overlap tests the real thing, so a leaf
       * picture such as a full-bleed `<svg>` is covered too.
       */
      const covered = drawnOver.some(other => overlaps(other.rect, node.rect))
      if (covered)
        node.isolate = true

      this.requests.push({
        sourceId: node.sourceId,
        isolate: node.isolate,
        hideDescendants: node.hideDescendants,
        clip: this.pageRects.get(node.sourceId),
        isolateId: this.originators.get(node.sourceId),
      })

      /**
       * Raster area that bought us nothing.
       *
       * A picture with editable text over it is not wasted work: a cover photo
       * covers the whole slide by definition while the title over it
       * vectorizes perfectly. Counting those sent every cover slide to the
       * whole-slide fallback and threw its text away.
       */
      if (texts.some(text => overlaps(text.rect, node.rect)))
        continue
      const visible = clipToSlide(node.rect, this.size)
      if (visible)
        this.rasterArea += visible.w * visible.h
    }

    return { nodes: this.nodes, requests: this.requests, rasterArea: this.rasterArea, textCount: texts.length }
  }

  /** Whether a picture was actually emitted for this element. */
  private emitRaster(node: RawNode, reason: RasterReason): boolean {
    this.pageRects.set(node.id, node.pageRect)
    if (node.tag === '::BEFORE' || node.tag === '::AFTER')
      this.originators.set(node.id, node.parent)
    const isolate = needsIsolation(reason)
    const visible = clipToSlide(node.rect, this.size)
    if (!visible)
      return false
    // An element that runs past the slide is captured as a page clip rather
    // than as itself, and placed at that same clipped rectangle so the picture
    // is not squashed. Screenshotting such an element whole is not merely
    // wasteful: Slidev's own starter deck carries one measuring tens of
    // millions of pixels, and asking Chromium to rasterize it kills the
    // renderer, which surfaces later as "Target page, context or browser has
    // been closed".
    const overflows = visible.w !== node.rect.w || visible.h !== node.rect.h
    if (overflows && node.pageRect) {
      this.pageRects.set(node.id, {
        x: node.pageRect.x + (visible.x - node.rect.x),
        y: node.pageRect.y + (visible.y - node.rect.y),
        w: visible.w,
        h: visible.h,
      })
    }

    this.push({
      kind: 'raster',
      sourceId: node.id,
      // Its children are walked and redrawn only when it is a backdrop, so
      // only then is it safe to hide them for the capture.
      hideDescendants: isolate,
      rect: overflows ? visible : node.rect,
      data: '',
      reason,
      isolate,
    }, node)
    return true
  }

  private emitImage(node: RawNode): void {
    if (!node.src)
      return
    // Clipped like every other shape. This was the one emitter that skipped
    // it, so a partly off-slide image landed outside the PowerPoint canvas.
    const rect = clipToSlide(node.rect, this.size)
    if (!rect)
      return
    // Clipping the BOX alone squeezed the whole image into it. The slide
    // container has `overflow: hidden`, so a browser shows the top of an
    // oversized image and cuts the rest off; scaling it to fit instead came
    // out vertically compressed and showed content the audience never saw.
    const clipped = rect.w !== node.rect.w || rect.h !== node.rect.h
    this.push({
      kind: 'image',
      sourceId: node.id,
      rect,
      data: node.src,
      alt: node.alt,
      link: this.linkFor(node),
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

  private emitBox(node: RawNode, style: RawStyle): void {
    // `emitTextGroup` paints every group node and descendant before the text,
    // and a layout container inside that subtree is then handed to `visit`,
    // which paints it again. Two opaque fills only waste a shape; two
    // translucent ones composite and come out visibly darker.
    if (this.boxed.has(node.id))
      return
    this.boxed.add(node.id)
    const fill = withOpacity(parseColor(style.backgroundColor), node.opacity)
    const borders: [Border?, Border?, Border?, Border?] = [
      borderOf(style, 'Top'),
      borderOf(style, 'Right'),
      borderOf(style, 'Bottom'),
      borderOf(style, 'Left'),
    ]
    const hasBorder = borders.some(Boolean)
    // Chromium keeps `border-radius` as a percentage in the computed value, so
    // it needs a basis. Without one, `border-radius: 50%` on a 200px box came
    // out as 50px rather than 100px and the corners were barely rounded.
    const radius = parseLength(style.borderTopLeftRadius, Math.min(node.rect.w, node.rect.h))
    if (!isVisible(fill) && !hasBorder)
      return
    const shadow = parseShadow(style.boxShadow)
    // One shape per line fragment for a wrapped inline element, because that
    // is what a browser paints. Drawn as one rect over the union instead, an
    // inline `<code>` running across several lines filled the ragged space at
    // the end of every line with its own background.
    const boxes = node.fragments?.length ? node.fragments : [node.rect]
    for (const source of boxes) {
      const rect = clipToSlide(source, this.size)
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
      this.push(box, node)
    }
  }

  private visit(node: RawNode): void {
    // A pseudo-element paints either an image or a short string. It has no
    // children and never contains anything else.
    if (node.tag === '::BEFORE' || node.tag === '::AFTER') {
      const style = this.styleOf(node)
      if (!style)
        return
      const reason = rasterReasonFor(node, style)
      if (reason && this.emitRaster(node, reason))
        return
      this.emitBox(node, style)
      if (node.text) {
        this.push({
          kind: 'text',
          sourceId: node.id,
          rect: node.rect,
          elementRect: node.rect,
          lineCount: 1,
          align: alignOf(style),
          valign: 'middle',
          lineHeight: resolveLineHeight(style),
          runs: [runFrom(node.text, style, this.fontResolution)],
        }, node)
      }
      return
    }

    if (node.tag === '#text') {
      // Reached only when a text node has no block container of its own, which
      // `visitChildren` already handles. Guarded so a stray one is not lost.
      this.emitTextGroup([node])
      return
    }

    const style = this.styleOf(node)
    const reason = rasterReasonFor(node, style)
    // A raster that could not be placed leaves NOTHING behind, so treating the
    // element as rasterized would silently drop its whole subtree. A theme
    // rotating a decoration through a zero-sized wrapper does exactly that:
    // the wrapper has no box of its own, while the absolutely positioned art
    // inside it does, and the entire corner decoration vanished from the deck.
    if (reason && this.emitRaster(node, reason)) {
      // A leaf such as an <svg> has no shapes worth recovering underneath it.
      // A backdrop does: its children are real content and are drawn as shapes
      // on top of the isolated picture.
      if (!needsIsolation(reason))
        return
      // But NOT its own box. The screenshot already contains this element's
      // background and borders, so drawing them again paints an opaque fill
      // straight over the picture that was taken to preserve the image, and
      // composites a translucent one twice.
      this.visitChildren(node)
      return
    }

    if (style)
      this.emitBox(node, style)

    if (node.tag === 'IMG') {
      this.emitImage(node)
      return
    }

    // A ::marker is a pseudo-element, so the bullet glyph has no text node and
    // a plain walk drops every bullet in the deck.
    if (node.marker && style) {
      const markerRect: Rect = {
        x: Math.max(0, node.rect.x - parseLength(style.fontSize) * 1.2),
        y: node.rect.y,
        w: parseLength(style.fontSize) * 1.2,
        h: resolveLineHeight(style),
      }
      this.push({
        kind: 'text',
        sourceId: node.id,
        rect: markerRect,
        elementRect: markerRect,
        lineCount: 1,
        align: 'left',
        // Centred in the line box, which is where a browser puts a marker.
        // Anchored to the top it rode above its own item's first line.
        valign: 'middle',
        lineHeight: resolveLineHeight(style),
        runs: [runFrom(node.marker, style, this.fontResolution, undefined, node.opacity)],
      }, node)
    }

    this.visitChildren(node)
  }

  private visitChildren(node: RawNode): void {
    const style = this.styleOf(node)
    const children = this.childrenOf(node.id)
    if (!children.length)
      return

    // A grid or flex container lays its children out as boxes, not as a line
    // box. Grouping them as one run of text concatenates unrelated cells into
    // strings like "Left cellRight cell".
    if (style && LAYOUT_DISPLAY.test(style.display)) {
      for (const child of children)
        this.visit(child)
      return
    }

    // Consecutive inline children form one anonymous block box, which is one
    // text box. Treating each as its own shape makes a bold lead-in and the
    // rest of its sentence lay out from the same origin, printing on top of
    // each other.
    let group: RawNode[] = []
    const flush = () => {
      if (group.length) {
        this.emitTextGroup(group)
        group = []
      }
    }
    for (const child of children) {
      if (this.isInline(child)) {
        // An inline element carrying its own background or border is a chip,
        // and its decoration is an absolutely positioned shape while the text
        // around it is a flowed text box. Left in the same box, any difference
        // between PowerPoint's metrics and the browser's accumulates across
        // the earlier runs and slides the label off its own chip.
        //
        // Given its own box at its own glyph bounds, the label is anchored to
        // where the browser actually put it, so the two cannot drift apart.
        //
        // Only when it is the WHOLE of its container. Slidev styles inline
        // `<code>` with a background, so an unconditional split cut ordinary
        // sentences into three boxes and forced the code span to centre; when
        // such a sentence wrapped, the two halves both laid out from the
        // container's left edge and overlapped. A chip is a label on its own,
        // not a word in the middle of a line.
        if (this.hasDecoration(child) && children.length === 1) {
          flush()
          this.emitTextGroup([child])
          continue
        }
        group.push(child)
      }
      else {
        flush()
        this.visit(child)
      }
    }
    flush()
  }

  /** Every text node under an inline subtree, in document order. */
  private collectText(node: RawNode, out: RawNode[]): void {
    if (node.tag === '#text') {
      out.push(node)
      return
    }
    const style = this.styleOf(node)
    const reason = rasterReasonFor(node, style)
    // An inline <svg> icon inside a sentence still has to become a picture,
    // but only if it has a box to be a picture of. Otherwise its subtree is
    // walked as usual rather than being dropped along with the raster.
    if (reason && this.emitRaster(node, reason))
      return
    // A <br> has no text node of its own, so without this marker the text
    // either side of it is concatenated into consecutive runs with no break
    // and `line one<br>line two` exports as "line oneline two".
    if (node.tag === 'BR') {
      out.push(node)
      return
    }
    // An inline <img> reaches here rather than `visit`, and has no text under
    // it, so it used to vanish from the slide entirely. Drawn at its measured
    // box, which is where the browser put it.
    if (node.tag === 'IMG') {
      this.emitImage(node)
      return
    }
    // Defensive: a layout container nested inside an inline run still lays its
    // children out as boxes. Descending as text merges its cells.
    if (style && LAYOUT_DISPLAY.test(style.display)) {
      this.visit(node)
      return
    }
    for (const child of this.childrenOf(node.id))
      this.collectText(child, out)
  }

  private emitTextGroup(group: RawNode[]): void {
    // Inline decorations first. A <span> with a coloured background behind
    // white text has to be painted BEFORE the text, because paint order is
    // array order; emitted after, the chip covers its own label.
    for (const node of group) {
      if (node.tag === '#text')
        continue
      // The group node ITSELF first, not only its descendants. The chip is
      // usually the outermost inline element in the group, so walking only
      // downwards from it missed the one background that mattered.
      const own = this.styleOf(node)
      if (own)
        this.emitBox(node, own)
      this.forEachDescendant(node, (descendant) => {
        const style = this.styleOf(descendant)
        if (style)
          this.emitBox(descendant, style)
      })
    }

    const textNodes: RawNode[] = []
    for (const node of group)
      this.collectText(node, textNodes)
    if (!textNodes.length)
      return

    const runs: IrRun[] = []
    const rects: Rect[] = []

    /**
     * Line breaks waiting to be attached to the next run.
     *
     * A count, not a flag. `softBreakBefore` is one break per run, so two
     * consecutive `<br>` need an empty run between them or the blank line
     * disappears. Held against the NEXT run rather than the previous one, so a
     * trailing break does not add an empty line at the end of the box.
     */
    let pendingBreaks = 0

    const push = (text: string, style: RawStyle, node: RawNode) => {
      // One empty run per surplus break, so the blank lines survive.
      while (pendingBreaks > 1 && runs.length) {
        runs.push({ ...runFrom('', style, this.fontResolution, undefined, node.opacity), breakBefore: true })
        pendingBreaks--
      }
      const run = runFrom(text, style, this.fontResolution, this.linkFor(node), node.opacity)
      if (pendingBreaks && runs.length)
        run.breakBefore = true
      pendingBreaks = 0
      runs.push(run)
    }

    for (const textNode of textNodes) {
      if (textNode.tag === 'BR') {
        pendingBreaks++
        continue
      }
      const style = this.inheritedStyle(textNode)
      if (!style)
        continue
      const raw = textNode.text ?? ''
      if (!raw)
        continue

      // `white-space: pre` keeps its newlines, and they are the ONLY record of
      // where one line of a code block ends. Shiki renders each line as an
      // inline span separated by a "\n" text node, so folding those into
      // spaces joins the whole block into one re-wrapped paragraph.
      if (style.whiteSpace.startsWith('pre')) {
        const lines = raw.split('\n')
        lines.forEach((line, index) => {
          if (index > 0)
            pendingBreaks++
          if (line)
            push(line, style, textNode)
        })
        rects.push(...(textNode.glyphRects ?? []))
        continue
      }

      const text = raw.replace(/\s+/g, ' ')
      if (!text.trim()) {
        // A whitespace-only node is the space between two inline elements.
        // Dropping it exports `<span>Hello</span> <span>World</span>` as
        // "HelloWorld". Folded into the previous run so it does not become a
        // run of its own with its own styling.
        if (runs.length && !runs[runs.length - 1].text.endsWith(' '))
          runs[runs.length - 1].text += ' '
        continue
      }
      push(text, style, textNode)
      rects.push(...(textNode.glyphRects ?? [textNode.rect]))
    }
    if (!runs.length || !rects.length)
      return

    // Whitespace at the start and end of a LINE collapses away in the browser,
    // but it survives `replace(/\s+/g, ' ')` and shifts a centred line
    // sideways by half a space, because markup normally puts each sentence on
    // its own source line. Every line boundary counts, not just the box edges:
    // a run after a break opens a new line.
    runs.forEach((run, index) => {
      const opensLine = index === 0 || run.breakBefore
      const closesLine = index === runs.length - 1 || runs[index + 1]?.breakBefore
      if (opensLine)
        run.text = run.text.replace(/^ +/, '')
      if (closesLine)
        run.text = run.text.replace(/ +$/, '')
    })

    const container = this.byId.get(group[0].parent)
    const containerStyle = container ? this.styleOf(container) : undefined
    const anchorStyle = containerStyle ?? this.inheritedStyle(textNodes[0])!

    const glyphs = boundsOf(rects)
    const lineCount = countLines(rects)

    /**
     * The box PowerPoint will wrap inside.
     *
     * Glyph bounds are the ink, not the wrap width, and for text that already
     * wrapped they are the width of the LONGEST LINE. Handing PowerPoint that
     * guarantees a second, tighter wrap: a caption reading "a short caption"
     * over two lines came back over three and overflowed its box.
     *
     * The browser wrapped against the container's content box, so that is the
     * width to reproduce. Single-line text keeps its glyph bounds, which are
     * exact and carry no wrapping risk.
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
     * A chip label belongs to its chip, not to its own ink.
     *
     * Its background is an absolutely positioned shape, so pinning the text to
     * the decoration's box and centring it there keeps the label evenly inset
     * however the font measures. Positioning from the glyphs instead leaves
     * the label hard against one edge as soon as PowerPoint sets the string
     * even slightly wider than the browser did.
     */
    const decorated = group.length === 1 && group[0].tag !== '#text' && this.hasDecoration(group[0])
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

    // Clipped like every other emitted node. Text was the one kind that was
    // not, so anything the browser clipped away landed off the PowerPoint
    // canvas where it cannot be selected, and still counted toward the text
    // total that suppresses the whole-slide fallback.
    if (!clipToSlide(rect, this.size))
      return

    this.push({
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

  private forEachDescendant(node: RawNode, fn: (node: RawNode) => void): void {
    for (const child of this.childrenOf(node.id)) {
      if (child.tag !== '#text')
        fn(child)
      this.forEachDescendant(child, fn)
    }
  }
}

export function normalize(snapshot: RawSnapshot, options: NormalizeOptions): NormalizeResult {
  unparsedColors = new Set()
  const slides: SlideIr[] = []
  const rasterRequests: RasterRequest[] = []

  for (const raw of snapshot.slides) {
    const walker = new SlideWalker(raw, snapshot.styles, snapshot.fontResolution)
    const { nodes, requests, rasterArea, textCount } = walker.run()

    const ir: SlideIr = {
      no: raw.no,
      clickIndex: raw.clickIndex,
      containerId: raw.containerId,
      size: raw.size,
      // The slide's own background. Without it every slide exported onto
      // PowerPoint's default white, so a dark theme came out as light text on
      // a white page.
      background: parseColor(raw.background),
      nodes,
      note: options.notes.get(raw.no),
    }

    const slideArea = raw.size.w * raw.size.h
    const hasSourceText = raw.nodes.some(n => n.tag === '#text' && (n.text ?? '').trim())

    // The safety valve. Both conditions describe a slide where vectorizing has
    // produced something worse than the picture it replaced, and both degrade
    // to exactly what `--format pptx` does today rather than to a broken file.
    if (hasSourceText && textCount === 0) {
      ir.fallbackReason = 'no text could be recovered from a slide that has text'
    }
    else if (slideArea > 0 && rasterArea / slideArea > RASTER_AREA_LIMIT) {
      // Capped: rasters can overlap, so the raw sum can exceed the slide and a
      // percentage over 100 reads as a bug rather than as a diagnosis.
      const percent = Math.min(100, Math.round((rasterArea / slideArea) * 100))
      ir.fallbackReason = `${percent}% of the slide had to be rasterized`
    }

    if (!ir.fallbackReason)
      rasterRequests.push(...requests)

    slides.push(ir)
  }

  return { slides, rasterRequests, unparsedColors: [...unparsedColors].sort() }
}
