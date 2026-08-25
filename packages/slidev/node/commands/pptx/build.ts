/**
 * `SlideIr[]` to a `.pptx` buffer, through `pptxgenjs`.
 *
 * Pure: no DOM, no Playwright, no filesystem. Everything it needs is in the
 * IR, which is plain JSON, so every rule in here is unit-testable by building
 * a fixture and unzipping the result.
 *
 * The three conversions this file owns are the ones most likely to be broken
 * silently by a future edit, so each has a test that asserts on the generated
 * XML rather than on the JavaScript.
 */

import type { Buffer } from 'node:buffer'
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
 * Extra width given to a text box beyond its measured glyph bounds.
 *
 * PowerPoint's text metrics are not Chromium's: the same string in the same
 * font at the same size sets to a slightly different width. Without slack, a
 * single-line label that measured 200.0px wide re-wraps in PowerPoint and the
 * slide gains a line nobody asked for.
 *
 * Single-line boxes get the generous value AND `wrap: false`, because they are
 * the case where a wrap is always wrong. Multi-line boxes get a token amount:
 * they are going to re-wrap differently no matter what, and widening them
 * pushes text into the neighbouring column.
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
 * CSS alpha (0 opaque..1) to PowerPoint transparency (0 opaque..100).
 *
 * Returned as undefined when fully opaque: `pptxgenjs` tests this field for
 * truthiness, so an explicit 0 and an absent value behave the same, and
 * omitting it keeps the generated XML free of no-op alpha elements.
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
    options.underline = { style: 'sng' }
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
  // `softBreakBefore` emits a real <a:br/> inside one paragraph, which is what
  // a <br> is. The alternative people reach for is a \v in the text, which
  // PowerPoint renders but Keynote and LibreOffice do not.
  if (run.breakBefore)
    options.softBreakBefore = true
  return options
}

function addText(slide: any, node: IrText): void {
  const slack = node.lineCount === 1 ? SLACK_SINGLE_LINE_PX : SLACK_MULTI_LINE_PX

  // Widening a box moves its content unless the origin moves too: a centred
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
      // PowerPoint's default text inset is 0.05in top/bottom and 0.1in
      // left/right. The IR position is glyph bounds, which already excludes
      // padding, so any inset here is a visible offset.
      margin: 0,
      // The default is 'middle', which would centre a one-line box inside a
      // height that was measured from the glyphs themselves.
      valign: node.valign ?? 'top',
      // No autofit. Autofit rescales type to fit the box, which would undo the
      // measured font size the moment PowerPoint disagrees about metrics.
      fit: 'none',
      isTextBox: true,
      wrap: node.lineCount > 1,
      lineSpacing: pt(node.lineHeight),
    },
  )
}

/**
 * One side of a border, as its own filled rectangle.
 *
 * Not a line: `pptxgenjs` gives a shape one uniform `line`, and the four-sided
 * form exists only on table cells. Not `addShape(LINE)` either, because a
 * line's stroke is centred on its geometry, so half of a 2px border would sit
 * outside the element box it is supposed to bound.
 */
function addEdge(slide: any, shapeType: any, box: IrBox, side: 0 | 1 | 2 | 3, border: Border): void {
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

  slide.addShape(shapeType.rect, {
    x: inch(rect.x),
    y: inch(rect.y),
    w: inch(rect.w),
    h: inch(rect.h),
    fill: { color: hex(border.color), transparency: transparency(border.color) },
    line: { type: 'none' },
  })
}

function sameBorder(a?: Border, b?: Border): boolean {
  if (!a || !b)
    return a === b
  return a.width === b.width && a.style === b.style && hex(a.color) === hex(b.color)
    && a.color.a === b.color.a
}

function addBox(slide: any, shapeType: any, node: IrBox): void {
  const borders = node.borders
  const uniform
    = borders
      && borders[0]
      && sameBorder(borders[0], borders[1])
      && sameBorder(borders[1], borders[2])
      && sameBorder(borders[2], borders[3])

  const options: Record<string, unknown> = {
    x: inch(node.rect.x),
    y: inch(node.rect.y),
    w: inch(node.rect.w),
    h: inch(node.rect.h),
    line: { type: 'none' },
  }

  if (node.fill) {
    options.fill = { color: hex(node.fill), transparency: transparency(node.fill) }
  }
  else {
    // A shape with no fill still paints white unless told otherwise.
    options.fill = { type: 'none' }
  }

  if (uniform && borders[0]) {
    options.line = {
      color: hex(borders[0].color),
      width: pt(borders[0].width),
      dashType: borders[0].style === 'solid' ? 'solid' : borders[0].style === 'dotted' ? 'sysDot' : 'dash',
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
    // `rectRadius` is documented as "values: 0.0 to 1.0". It is not. The
    // runtime multiplies it by EMU before dividing by the shorter side, so a
    // value in the documented range rounds to zero and every corner comes out
    // square. It is an inch measurement like every other coordinate.
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

function addPicture(slide: any, node: IrImage | IrRaster): void {
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
  }
  else {
    // A rasterized element is unreadable to a screen reader without this, and
    // "why it is a picture" is the most useful thing to say about it.
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
 * Build the deck.
 *
 * `PptxGenJS` is passed in rather than imported so this module stays pure and
 * so the caller keeps the existing dynamic `import('pptxgenjs')`, which is
 * what keeps it off the CLI's startup path.
 */
export async function buildPptx(
  PptxGenJS: any,
  slides: SlideIr[],
  options: BuildOptions,
): Promise<Buffer> {
  const pptx = new PptxGenJS()

  // Same layout the image exporter defines, deliberately. Changing it here
  // would silently change `--format pptx` output too, since both read the
  // deck's canvas size.
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
      // Exactly what `--format pptx` produces, for this slide only. A theme
      // the walker cannot handle degrades to today's behaviour rather than to
      // a slide that is subtly wrong.
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
