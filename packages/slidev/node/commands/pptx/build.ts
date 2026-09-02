/**
 * `SlideIr[]` to a `.pptx` buffer, through `pptxgenjs`. Pure: no DOM,
 * Playwright or filesystem, so every rule is unit-testable by building a
 * fixture and unzipping the result.
 */

import type { Buffer } from 'node:buffer'
import type PptxGenJS from 'pptxgenjs'
import type {
  Border,
  IrBox,
  IrImage,
  IrRaster,
  IrRun,
  IrText,
  Rgba,
  SlideIr,
} from './ir'
import { INCHES_PER_PX, PT_PER_PX } from './ir'

/**
 * Extra width beyond the measured glyph bounds: PowerPoint sets the same
 * string slightly wider than Chromium, so a tight single-line box re-wraps.
 * Single-line boxes get the generous value and `wrap: false`; multi-line
 * boxes re-wrap anyway, and widening them pushes into the next column.
 */
const SLACK_SINGLE_LINE_PX = 12
const SLACK_MULTI_LINE_PX = 2

function hex(color: Rgba): string {
  const channel = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
    .toString(16)
    .padStart(2, '0')
    .toUpperCase()
  return `${channel(color.r)}${channel(color.g)}${channel(color.b)}`
}

/**
 * CSS alpha (0 opaque..1) to PowerPoint transparency (0 opaque..100), or
 * undefined when fully opaque: `pptxgenjs` tests the field for truthiness.
 */
function transparency(color: Rgba): number | undefined {
  if (color.a >= 1)
    return undefined
  return Math.round((1 - color.a) * 100)
}

/** Canvas pixels to inches, which is what every `pptxgenjs` coordinate wants. */
function inch(px: number): number {
  return px * INCHES_PER_PX
}

/** Canvas pixels to points, which is what every `pptxgenjs` type size wants. */
function pt(px: number): number {
  return px * PT_PER_PX
}

function runProps(run: IrRun): Record<string, unknown> {
  const options: Record<string, unknown> = {
    fontFace: run.fontFamily,
    fontSize: pt(run.fontSize),
  }
  if (run.bold)
    options.bold = true
  if (run.italic)
    options.italic = true
  if (run.strike)
    options.strike = true
  if (run.underline)
    options.underline = { style: run.underlineStyle ?? 'sng' }
  else if (run.link)
    // pptxgenjs underlines every hyperlink run unless told otherwise. CSS said
    // not to: a theme that rules its links with a `border-bottom` already has
    // that drawn as its own shape, so the default added a second line.
    options.underline = { style: 'none' }
  if (run.color) {
    options.color = hex(run.color)
    const alpha = transparency(run.color)
    if (alpha !== undefined)
      options.transparency = alpha
  }
  if (run.letterSpacing)
    options.charSpacing = pt(run.letterSpacing)
  if (run.link)
    options.hyperlink = { url: run.link }
  if (run.endsParagraph)
    options.breakLine = true
  // `softBreakBefore` emits a real <a:br/> inside one paragraph; a \v in the
  // text renders in PowerPoint but not in Keynote or LibreOffice.
  if (run.breakBefore)
    options.softBreakBefore = true
  return options
}

function addText(slide: PptxGenJS.Slide, node: IrText): void {
  const slack = node.lineCount === 1 ? SLACK_SINGLE_LINE_PX : SLACK_MULTI_LINE_PX

  // Widening a box moves its content unless the origin moves too: a centered
  // line would drift right by half the slack, a right-aligned one by all of it.
  let x = node.rect.x
  if (node.align === 'center')
    x -= slack / 2
  else if (node.align === 'right')
    x -= slack

  slide.addText(
    node.runs.map(run => ({ text: run.text, options: runProps(run) })),
    {
      x: inch(x),
      y: inch(node.rect.y),
      w: inch(node.rect.w + slack),
      h: inch(node.rect.h),
      align: node.align,
      // PowerPoint's default inset is 0.05in/0.1in; the IR position is glyph
      // bounds, so any inset here is a visible offset.
      margin: 0,
      // The default 'middle' would center a one-line box measured from the glyphs.
      valign: node.valign ?? 'top',
      // Autofit would rescale type the moment PowerPoint disagrees about metrics.
      fit: 'none',
      isTextBox: true,
      wrap: node.lineCount > 1,
      // Only for multi-line text: a single-line box is measured from glyph ink,
      // shorter than the CSS line box, and the taller value clips descenders.
      ...(node.lineCount > 1 ? { lineSpacing: pt(node.lineHeight) } : {}),
    },
  )
}

/**
 * One side of a border, as its own filled rectangle: `pptxgenjs` gives a shape
 * one uniform `line`, and `addShape(LINE)` centers its stroke on the geometry,
 * putting half the border outside the element box.
 */
function addEdge(slide: PptxGenJS.Slide, shapeType: typeof PptxGenJS.ShapeType, box: IrBox, side: 0 | 1 | 2 | 3, border: Border): void {
  const { x, y, w, h } = box.rect
  const t = border.width
  const rect
    = side === 0
      ? { x, y, w, h: t }
      : side === 1
        ? { x: x + w - t, y, w: t, h }
        : side === 2
          ? { x, y: y + h - t, w, h: t }
          : { x, y, w: t, h }

  // A filled rectangle cannot carry a dash pattern, so a dashed or dotted rule
  // came out solid: Slidev rules its links this way, and every link in a deck
  // gained a solid bar. A line can be dashed, and for a hairline the half
  // stroke that falls outside the box is well under a pixel.
  if (border.style !== 'solid') {
    slide.addShape(shapeType.line, {
      x: inch(rect.x),
      y: inch(rect.y),
      w: inch(side === 0 || side === 2 ? rect.w : 0),
      h: inch(side === 0 || side === 2 ? 0 : rect.h),
      line: {
        color: hex(border.color),
        transparency: transparency(border.color),
        width: pt(border.width),
        dashType: border.style === 'dotted' ? 'sysDot' : 'dash',
      },
    })
    return
  }

  slide.addShape(shapeType.rect, {
    x: inch(rect.x),
    y: inch(rect.y),
    w: inch(rect.w),
    h: inch(rect.h),
    fill: { color: hex(border.color), transparency: transparency(border.color) },
  })
}

function sameBorder(a?: Border, b?: Border): boolean {
  if (!a || !b)
    return a === b
  return a.width === b.width && a.style === b.style && hex(a.color) === hex(b.color)
    && a.color.a === b.color.a
}

function addBox(slide: PptxGenJS.Slide, shapeType: typeof PptxGenJS.ShapeType, node: IrBox): void {
  const borders = node.borders
  const uniform
    = borders
      && borders[0]
      && sameBorder(borders[0], borders[1])
      && sameBorder(borders[1], borders[2])
      && sameBorder(borders[2], borders[3])

  // With no fill and no uniform border there is nothing for this shape to
  // carry: its only border is drawn as its own edge below. Emitting it anyway
  // left a rectangle with neither fill nor outline specified, which PowerPoint
  // resolves from its default shape style rather than leaving blank.
  if (!node.fill && !uniform && !node.shadow) {
    for (const side of [0, 1, 2, 3] as const) {
      const border = borders?.[side]
      if (border && border.width > 0)
        addEdge(slide, shapeType, node, side, border)
    }
    return
  }

  const options: Record<string, unknown> = {
    x: inch(node.rect.x),
    y: inch(node.rect.y),
    w: inch(node.rect.w),
    h: inch(node.rect.h),
  }

  // `fill` and `line` are omitted rather than set to `{ type: 'none' }`.
  // pptxgenjs writes `<a:noFill/>` for an ABSENT fill and nothing at all for
  // that object, so the explicit-looking version was the one that inherited.
  if (node.fill)
    options.fill = { color: hex(node.fill), transparency: transparency(node.fill) }

  if (uniform && borders[0]) {
    options.line = {
      color: hex(borders[0].color),
      width: pt(borders[0].width),
      dashType: borders[0].style === 'solid' ? 'solid' : borders[0].style === 'dotted' ? 'sysDot' : 'dash',
      // `ShapeLineProps extends ShapeFillProps`: without `transparency` a
      // hairline set in `rgba(0, 0, 0, 0.1)` comes out solid black.
      transparency: transparency(borders[0].color),
    }
  }

  if (node.shadow) {
    options.shadow = {
      type: 'outer',
      blur: pt(node.shadow.blur),
      offset: pt(node.shadow.offset),
      angle: node.shadow.angle,
      color: hex(node.shadow.color),
      opacity: node.shadow.color.a,
    }
  }

  if (node.radius) {
    // `rectRadius` is documented as "values: 0.0 to 1.0" but is an inch
    // measurement: the runtime multiplies it by EMU before dividing by the
    // shorter side, so a value in the documented range rounds to zero.
    const shorter = Math.min(node.rect.w, node.rect.h)
    options.rectRadius = inch(Math.min(node.radius, shorter / 2))
    slide.addShape(shapeType.roundRect, options)
  }
  else {
    slide.addShape(shapeType.rect, options)
  }

  if (borders && !uniform) {
    for (const side of [0, 1, 2, 3] as const) {
      const border = borders[side]
      if (border && border.width > 0)
        addEdge(slide, shapeType, node, side, border)
    }
  }
}

function addPicture(slide: PptxGenJS.Slide, node: IrImage | IrRaster): void {
  const options: Record<string, unknown> = {
    data: node.data,
    x: inch(node.rect.x),
    y: inch(node.rect.y),
    w: inch(node.rect.w),
    h: inch(node.rect.h),
  }
  if (node.kind === 'image') {
    if (node.alt)
      options.altText = node.alt
    if (node.link)
      options.hyperlink = { url: node.link }
    // `sizing.crop` reads `w`/`h` as the picture's full display size and the
    // visible window from `sizing`, the opposite of every other option here;
    // `<a:srcRect>` trims the rest away.
    if (node.crop) {
      options.w = inch(node.crop.w)
      options.h = inch(node.crop.h)
      options.sizing = {
        type: 'crop',
        x: inch(node.crop.x),
        y: inch(node.crop.y),
        w: inch(node.rect.w),
        h: inch(node.rect.h),
      }
    }
  }
  else {
    // The reason is the most useful alt text a rasterized element can carry.
    options.altText = `Rendered as an image because of CSS ${node.reason}`
  }
  slide.addImage(options)
}

export interface BuildOptions {
  /** Canvas width in pixels. The slide becomes `width / 96` inches wide. */
  width: number
  /** Canvas height in pixels. */
  height: number
  title?: string
  author?: string
  subject?: string
}

/**
 * Build the deck. The constructor is passed in so the caller keeps its dynamic
 * `import('pptxgenjs')`, which keeps the library off the CLI's startup path.
 */
export async function buildPptx(
  Pptx: typeof PptxGenJS,
  slides: SlideIr[],
  options: BuildOptions,
): Promise<Buffer> {
  const pptx = new Pptx()

  // Same layout the image exporter defines; changing it here would silently
  // change `--format pptx` output too.
  const layoutName = `${options.width}x${options.height}`
  pptx.defineLayout({
    name: layoutName,
    width: inch(options.width),
    height: inch(options.height),
  })
  pptx.layout = layoutName

  pptx.company = 'Created using Slidev'
  if (options.title)
    pptx.title = options.title
  if (options.author)
    pptx.author = options.author
  if (options.subject)
    pptx.subject = options.subject

  for (const ir of slides) {
    const slide = pptx.addSlide()

    if (ir.fallbackPng) {
      // Exactly what `--format pptx` produces, for this slide only: a theme
      // the walker cannot handle degrades to today's behavior.
      slide.background = { data: ir.fallbackPng }
    }
    else {
      if (ir.background) {
        slide.background = {
          color: hex(ir.background),
          transparency: transparency(ir.background),
        }
      }
      for (const node of ir.nodes) {
        switch (node.kind) {
          case 'box':
            addBox(slide, pptx.ShapeType, node)
            break
          case 'text':
            addText(slide, node)
            break
          case 'image':
          case 'raster':
            addPicture(slide, node)
            break
        }
      }
    }

    if (ir.note)
      slide.addNotes(ir.note)
  }

  return await pptx.write({ outputType: 'nodebuffer' }) as Buffer
}
