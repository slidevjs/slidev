/**
 * The intermediate representation between the rendered DOM and a `.pptx`.
 *
 * Two levels, on purpose:
 *
 * - `RawSnapshot` is what the in-page walker returns. It stays deliberately
 *   close to the DOM and contains no judgement at all, because everything
 *   inside `page.evaluate` is unreachable from a unit test.
 * - `SlideIr` is what the normalizer produces. It stays deliberately close to
 *   what `pptxgenjs` wants, so the builder is a translation rather than a
 *   second round of decisions.
 *
 * Every judgement lives in `normalize.ts`, between the two, as pure functions
 * over plain JSON. That split is the whole reason this is testable without a
 * browser.
 *
 * This file has no imports and no runtime behaviour beyond three constants, so
 * it can be shared with the browser exporter later without moving anything.
 */

/**
 * All geometry is in CANVAS PIXELS: the deck's `canvasWidth` by
 * `round(canvasWidth / aspectRatio)` space, with the origin at the top-left of
 * the slide (NOT of the print page, which stacks every slide into one tall
 * viewport).
 *
 * `exportSlides` sizes the PowerPoint slide as `width / 96` by `height / 96`
 * INCHES, so one CSS pixel is exactly 1/96 inch whatever `canvasWidth` is.
 * That makes the EMU conversion an integer and there is no rounding drift.
 *
 * Do not assume 1px = 1pt. That holds only for a 960px canvas on a 13.333in
 * slide, which is one specific corporate template and not Slidev's default.
 */
export const EMU_PER_PX = 9525 // 914400 EMU per inch / 96 px per inch
export const INCHES_PER_PX = 1 / 96

/**
 * Points per pixel, for font size, letter spacing and line height.
 *
 * PowerPoint measures type in points and the canvas measures it in pixels, at
 * 96 px per inch against 72 pt per inch. Forgetting this factor makes every
 * font a third too large, which reads as "the export is broken" rather than as
 * a unit bug.
 */
export const PT_PER_PX = 0.75 // 72 / 96

// ---------------------------------------------------------------------------
// Walker output
// ---------------------------------------------------------------------------

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/**
 * The computed-style subset the walker captures, as raw CSS strings.
 *
 * Kept as strings because parsing is judgement and judgement belongs on the
 * Node side. Kept to a fixed subset because `getComputedStyle` exposes several
 * hundred properties and serialising all of them for every node is what turns
 * a snapshot into megabytes.
 *
 * Records are INTERNED: `RawNode.style` is an index into `RawSnapshot.styles`.
 * A real slide has a few hundred nodes and a few dozen distinct styles.
 */
export interface RawStyle {
  display: string
  position: string
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
  /**
   * Text nodes only: `Range.getClientRects()`, slide-relative.
   *
   * The raw list rather than a bounding box, because the normalizer counts
   * distinct line-box tops from it. A text box positioned from the ELEMENT
   * rect rather than from glyph bounds lands offset and re-wraps.
   */
  glyphRects?: Rect[]
  /** Text nodes only: raw `textContent`, before `text-transform` is applied. */
  text?: string
  /** `IMG` only. */
  src?: string
  /** `IMG` only. */
  alt?: string
  /** `A` only, resolved absolute. */
  href?: string
  /**
   * An `SVG` carrying `<foreignObject>`, which means its labels are HTML with
   * no `<text>` element. Mermaid renders this way and no PowerPoint renderer
   * draws it, so it has to be rasterized.
   */
  hasForeignObject?: boolean
  /** Reached through `el.shadowRoot`. Mermaid diagrams live in one. */
  fromShadowRoot?: boolean
  /** A `::marker` list bullet, which is a pseudo-element and has no text node. */
  marker?: string
}

export interface RawSlide {
  /** 1-based deck slide number, parsed from the container id `003-02`. */
  no: number
  /** 0-based click step within that slide. */
  clickIndex: number
  /**
   * The container's exact DOM id, e.g. `003-02`.
   *
   * Kept verbatim so a screenshot can target this step. Rebuilding a selector
   * from `no` matches every click step of the slide, and taking the first hit
   * gives every step a picture of step one.
   */
  containerId: string
  size: { w: number, h: number }
  /** The slide's own background colour, as a raw CSS string. */
  background?: string
  nodes: RawNode[]
}

export interface RawSnapshot {
  slides: RawSlide[]
  styles: RawStyle[]
  /**
   * CSS font stack as written, mapped to the family the browser actually
   * resolved it to.
   *
   * This has to be measured in the page, by comparing the rendered width of a
   * probe string against generic bases. `document.fonts.check()` cannot be
   * used: it returns true for families that do not exist, so a deck whose CSS
   * leads with a licensed face names that face in the file and every recipient
   * silently gets a substitution.
   */
  fontResolution: Record<string, string>
}

// ---------------------------------------------------------------------------
// Normalizer output
// ---------------------------------------------------------------------------

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
   * Top, right, bottom, left. A side is undefined when it has no visible
   * border.
   *
   * Four sides rather than one border because `pptxgenjs` gives a shape a
   * single uniform `line`; the four-sided form exists only on table cells. The
   * builder emits each differing side as its own filled rectangle.
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
  /**
   * Glyph bounds, NOT the element box. See `RawNode.glyphRects`.
   */
  kind: 'text'
  /** Kept for diagnostics and for future placeholder matching. */
  elementRect: Rect
  /** Distinct line-box tops. One means the box must not be allowed to re-wrap. */
  lineCount: number
  align: 'left' | 'center' | 'right' | 'justify'
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
}

export type RasterReason
  = | 'svg'
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
  /**
   * Capture with everything else on the page hidden.
   *
   * `locator.screenshot()` clips the page to the element's box rather than
   * isolating the element, so anything overlapping that box lands in the
   * picture. Whatever we also draw as a shape would then appear twice.
   */
  isolate: boolean
  /**
   * Also hide the element's own children while capturing.
   *
   * Only correct when those children are walked and redrawn as shapes, which
   * is true for a backdrop and false for a leaf such as an `<svg>`. Hiding a
   * leaf's children removes its artwork from the picture and nothing puts it
   * back, which emptied the decorative chrome out of a themed deck.
   */
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
  /**
   * Paint order IS array order.
   *
   * An inline decoration, such as a `<span>` with a background colour behind
   * white text, must be emitted before the text it sits behind, or the text
   * disappears into the page.
   */
  nodes: IrNode[]
  note?: string
  /**
   * The safety valve. When set, `nodes` is ignored and the slide is written as
   * a single background picture, exactly as `--format pptx` does today.
   *
   * Set when the walk failed, when the slide lost all of its text, or when so
   * much of it rasterized that vectorizing bought nothing. A theme this
   * heuristic cannot handle degrades to current behaviour rather than to a
   * broken file.
   */
  fallbackPng?: string
  fallbackReason?: string
}
