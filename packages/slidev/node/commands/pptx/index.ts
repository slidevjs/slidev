import type { SlideInfo } from '@slidev/types'
import type { Page } from 'playwright-chromium'
import fs from 'node:fs/promises'
import { buildPptx } from './build'
import { capture, ID_ATTRIBUTE } from './capture'
import { normalize } from './normalize'
import { collectSnapshot } from './walker'

/**
 * Everything the editable exporter needs from `exportSlides`, as an explicit
 * object rather than as closure scope.
 *
 * The existing per-format generators are nested closures over `exportSlides`'s
 * locals. Following that pattern would have put this whole feature inside an
 * already 665-line function. Taking a context instead keeps `export.ts` to a
 * five-line change, and matches the shape `plans/023` wants when the per-format
 * extraction eventually happens.
 */
export interface PptxExportContext {
  page: Page
  slides: SlideInfo[]
  /** Canvas width in pixels. */
  width: number
  /** Canvas height in pixels. */
  height: number
  /**
   * The 1-based slide numbers `--range` selected.
   *
   * The print route renders EVERY slide whatever the `range` query says, so
   * this has to be applied here. The image exporter does the same thing with
   * `if (!pages.includes(slideNo)) continue`.
   */
  pages: number[]
  /** Navigate and wait for the deck to settle. `exportSlides` owns this. */
  go: (no: number | string, clicks?: string) => Promise<void>
}

export interface EditableExportResult {
  slideCount: number
  fallbackSlides: { no: number, reason: string }[]
  fontsNamed: string[]
  /** Images that could be neither fetched nor screenshotted. */
  imagesDropped: number
  /** Captures that asked for isolation and could not find their element. */
  isolationMissed: number
  /** Elements whose screenshot failed, so they are missing from the file. */
  rastersFailed: number
  /** Colour strings no parser understood, so the user can report them. */
  unparsedColors: string[]
  /** Decorative pseudo-elements whose box could not be resolved. */
  unplaceablePseudos: string[]
  /** The path actually written, extension included. */
  output: string
}

/**
 * Export the deck as PowerPoint with native shapes and editable text.
 *
 * One navigation covers the whole deck: the print route renders every slide,
 * and every click step, into a single tall page, which is also how the image
 * exporter finds its slide indexes. So there is no per-slide loop here, and
 * `--with-clicks` needs no special handling: each step is already its own
 * `.print-slide-container`.
 */
export async function exportPptxEditable(
  ctx: PptxExportContext,
  output: string,
): Promise<EditableExportResult> {
  await ctx.go('print')

  // Measurement and capture are two separate passes over the page, so anything
  // still moving between them is measured at one frame and photographed at
  // another. A theme spinning a logo forever came out cropped and rotated
  // against its own box. Pausing rather than cancelling keeps a reveal
  // animation at the end state the deck settled on, which is what the audience
  // saw; `animation: none` would rewind a fade-in to opacity zero instead.
  await ctx.page.addStyleTag({
    content: '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }',
  })

  const snapshot = await ctx.page.evaluate(collectSnapshot, {
    containerSelector: '.print-slide-container',
    idAttribute: ID_ATTRIBUTE,
  })

  // Filtered before normalizing, so out-of-range slides cost no measurement
  // work and no screenshots.
  snapshot.slides = snapshot.slides.filter(slide => ctx.pages.includes(slide.no))

  const notes = new Map<number, string | undefined>()
  ctx.slides.forEach((slide, index) => notes.set(index + 1, slide.note))

  const { slides, rasterRequests, unparsedColors } = normalize(snapshot, { notes })
  const report = await capture(ctx.page, slides, rasterRequests)

  const title = ctx.slides[0]
  const buffer = await buildPptx(
    (await import('pptxgenjs')).default,
    slides,
    {
      width: ctx.width,
      height: ctx.height,
      title: title?.title,
      author: title?.frontmatter?.author,
      subject: title?.frontmatter?.info,
    },
  )

  // Returned rather than only used here: `exportSlides` prints the path it was
  // given, so appending the extension locally told the user "exported to
  // ./slides-export" for a file written as ./slides-export.pptx.
  const written = output.endsWith('.pptx') ? output : `${output}.pptx`
  await fs.writeFile(written, buffer)

  return {
    output: written,
    slideCount: slides.length,
    fallbackSlides: report.fallbackSlides,
    imagesDropped: report.imagesDropped,
    isolationMissed: report.isolationMissed,
    rastersFailed: report.rastersFailed,
    unparsedColors,
    unplaceablePseudos: [...new Set(snapshot.unplaceablePseudos ?? [])].sort(),
    // A pptx NAMES fonts, it does not carry them. Reporting which families the
    // file asks for is the only way an author learns what recipients need
    // installed before the deck reaches them looking wrong.
    fontsNamed: [...new Set(Object.values(snapshot.fontResolution).filter(Boolean))].sort(),
  }
}
