/**
 * Intermediate representation between the rendered DOM and a `.pptx`.
 * `RawSnapshot` is what the in-page walker returns and stays close to the DOM
 * (code inside `page.evaluate` is unreachable from unit tests). `SlideIr` is
 * what the normalizer produces and stays close to what `pptxgenjs` wants.
 * Every decision lives in `normalize.ts` between the two, as pure functions
 * over plain JSON, testable without a browser.
 */

/**
 * All geometry is in canvas pixels: `canvasWidth` by `round(canvasWidth / aspectRatio)`,
 * origin at the top-left of the slide (not of the print page). `exportSlides`
 * sizes the PowerPoint slide as `width / 96` by `height / 96` inches, so one
 * CSS pixel is exactly 1/96 inch. 1px = 1pt does not hold in general.
 */
export const EMU_PER_PX = 9525 // 914400 EMU per inch / 96 px per inch
export const INCHES_PER_PX = 1 / 96

/** Points per pixel (72 pt per inch against 96 px per inch), for font size, letter spacing and line height. */
export const PT_PER_PX = 0.75 // 72 / 96

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/**
 * The computed-style subset the walker captures, as raw CSS strings; parsing
 * happens on the Node side. Interned: `RawNode.style` indexes `RawSnapshot.styles`.
 */
export interface RawStyle {
  display: string
  position: string
  zIndex: string
  visibility: string
  opacity: string
  color: string
  backgroundColor: string
  backgroundImage: string
  fontFamily: string
  fontSize: string
  fontWeight: string
  fontStyle: string
  textAlign: string
  textDecorationLine: string
  textTransform: string
  letterSpacing: string
  lineHeight: string
  whiteSpace: string
  paddingLeft: string
  paddingRight: string
  borderTopWidth: string
  borderTopStyle: string
  borderTopColor: string
  borderRightWidth: string
  borderRightStyle: string
  borderRightColor: string
  borderBottomWidth: string
  borderBottomStyle: string
  borderBottomColor: string
  borderLeftWidth: string
  borderLeftStyle: string
  borderLeftColor: string
  borderTopLeftRadius: string
  boxShadow: string
  filter: string
  backdropFilter: string
  mixBlendMode: string
  clipPath: string
  transform: string
  writingMode: string
  webkitBackgroundClip: string
  overflow: string
  top: string
  right: string
  bottom: string
  left: string
  width: string
  height: string
}

export interface RawNode {
  /** Index into `RawSnapshot.nodes`, and the value of `data-slidev-export-id`. */
  id: number
  /** Parent's `id`, or -1 for the slide container itself. */
  parent: number
  /** Upper-case tag name, or `#text` for a text node. */
  tag: string
  /** Index into `RawSnapshot.styles`; -1 for text nodes, which have no style. */
  style: number
  /** Relative to the slide container, not to the print page. */
  rect: Rect
  /** Text nodes only: `Range.getClientRects()`, slide-relative. Kept as the raw list so the normalizer can count line boxes; a text box positioned from the element rect lands offset and re-wraps. */
  glyphRects?: Rect[]
  /** Text nodes only: raw `textContent`, before `text-transform` is applied. */
  text?: string
  /** One rect per line box for a wrapped inline element. Backgrounds and borders paint per line fragment, not over the `getBoundingClientRect()` union. */
  fragments?: Rect[]
  /** `IMG` only. */
  src?: string
  /** `IMG` only. */
  alt?: string
  /** `A` only, resolved absolute. */
  href?: string
  /** Root of a rendered formula. KaTeX sets it as dozens of positioned spans in its own metric fonts; walked as text the layout falls apart, so it is rasterized whole. */
  isMath?: boolean
  /** An `SVG` carrying `<foreignObject>` (as Mermaid renders), so its labels are HTML. No PowerPoint renderer draws that; it has to be rasterized. */
  hasForeignObject?: boolean
  /** Reached through `el.shadowRoot`. Mermaid diagrams live in one. */
  fromShadowRoot?: boolean
  /** Opacity compounded from every ancestor, present only when below 1. DrawingML has no group opacity, so a wrapper's transparency is folded into each descendant's colors. */
  opacity?: number
  /** A `::marker` list bullet, which is a pseudo-element and has no text node. */
  marker?: string
  /** Page coordinates. A `::before` or `::after` has no element of its own, so a screenshot clips the page instead of targeting a locator. */
  pageRect?: Rect
}

export interface RawSlide {
  /** 1-based deck slide number, parsed from the container id `003-02`. */
  no: number
  /** 0-based click step within that slide. */
  clickIndex: number
  /** The container's exact DOM id, e.g. `003-02`. A selector rebuilt from `no` matches every click step of the slide, so screenshots target this instead. */
  containerId: string
  size: { w: number, h: number }
  /** The slide's own background color, as a raw CSS string. */
  background?: string
  nodes: RawNode[]
}

export interface RawSnapshot {
  slides: RawSlide[]
  styles: RawStyle[]
  /**
   * CSS font stack as written, mapped to the family the browser actually resolved,
   * measured by comparing rendered widths in the page. `document.fonts.check()`
   * cannot be used: it returns true for families that do not exist.
   */
  fontResolution: Record<string, string>
  /** Pseudo-elements that paint something but take part in flow, so their box cannot be resolved from computed style. Reported so the loss is logged rather than silent. */
  unplaceablePseudos: string[]
}

/** Straight (non-premultiplied) alpha, 0 to 1. */
export interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

export interface Border {
  width: number
  color: Rgba
  style: 'solid' | 'dashed' | 'dotted'
}

interface IrBase {
  rect: Rect
  /** The `RawNode.id` this came from. Only for diagnostics. */
  sourceId: number
}

export interface IrBox extends IrBase {
  kind: 'box'
  fill?: Rgba
  /**
   * Top, right, bottom, left; a side is undefined when it has no visible border.
   * `pptxgenjs` gives a shape a single uniform `line`, so the builder emits
   * each differing side as its own filled rectangle.
   */
  borders?: [Border?, Border?, Border?, Border?]
  /** Pixels. The builder converts; `rectRadius` is in inches despite its docs. */
  radius?: number
  shadow?: { blur: number, offset: number, angle: number, color: Rgba }
}

export interface IrRun {
  /** Already `text-transform`ed. */
  text: string
  /** Pixels. */
  fontSize: number
  /** Already resolved to a family that exists on this machine. */
  fontFamily: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  color?: Rgba
  /** Pixels. */
  letterSpacing?: number
  link?: string
  /** Emit a line break before this run. From `<br>`. */
  breakBefore?: boolean
  /** This run ends a paragraph. */
  endsParagraph?: boolean
}

export interface IrText extends IrBase {
  /** `rect` is glyph bounds, not the element box. See `RawNode.glyphRects`. */
  kind: 'text'
  elementRect: Rect
  /** Distinct line-box tops. One means the box must not be allowed to re-wrap. */
  lineCount: number
  align: 'left' | 'center' | 'right' | 'justify'
  /** Defaults to top, since the box is measured from the glyphs; middle is for chip labels, whose box is the decoration rather than the ink. */
  valign?: 'top' | 'middle'
  /** Pixels, with `normal` already resolved to a number. */
  lineHeight: number
  runs: IrRun[]
}

export interface IrImage extends IrBase {
  kind: 'image'
  /** A `data:` URI. Always raster; SVG is routed to `IrRaster` instead. */
  data: string
  alt?: string
  link?: string
  /**
   * The visible region when the slide edge cuts the image short: draw at full
   * size, then crop to `rect`, as the browser does; squeezing into the clipped
   * box would compress it. All values are CSS pixels: `w`/`h` the full display
   * size, `x`/`y` the offset from its top-left corner to `rect`.
   */
  crop?: { x: number, y: number, w: number, h: number }
}

export type RasterReason
  = | 'svg'
    | 'math'
    | 'foreign-object'
    | 'canvas'
    | 'media'
    | 'iframe'
    | 'background-image'
    | 'background-clip-text'
    | 'filter'
    | 'backdrop-filter'
    | 'mix-blend-mode'
    | 'clip-path'
    | 'transform'
    | 'writing-mode'

export interface IrRaster extends IrBase {
  kind: 'raster'
  /** A PNG `data:` URI, filled in by the capture phase. */
  data: string
  reason: RasterReason
  /** Capture with everything else on the page hidden. `locator.screenshot()` clips the page to the element's box rather than isolating the element, so overlapping content would land in the picture and be drawn twice. */
  isolate: boolean
  /** Also hide the element's own children while capturing. Correct only when they are walked and redrawn as shapes; hiding a leaf's children (e.g. an `<svg>`) removes its artwork from the picture. */
  hideDescendants: boolean
}

export type IrNode = IrBox | IrText | IrImage | IrRaster

export interface SlideIr {
  /** 1-based deck slide number. */
  no: number
  clickIndex: number
  /** The rendered container's exact DOM id, for targeting a screenshot. */
  containerId: string
  size: { w: number, h: number }
  background?: Rgba
  /** Paint order is array order: an inline decoration must be emitted before the text it sits behind. */
  nodes: IrNode[]
  note?: string
  /**
   * When set, `nodes` is ignored and the slide is written as a single background
   * picture, exactly as `--format pptx` does. Set when the walk failed, the
   * slide lost all of its text, or so much rasterized that vectorizing bought nothing.
   */
  fallbackPng?: string
  fallbackReason?: string
}
