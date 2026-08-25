import type { SlideInfo } from '@slidev/types'
import type { Page } from 'playwright-chromium'
import fs from 'node:fs/promises'
import { dim, yellow } from 'ansis'
import { buildPptx } from './build'
import { capture, ID_ATTRIBUTE } from './capture'
import { normalize } from './normalize'
import { collectSnapshot } from './walker'

/** Everything the editable exporter needs from `exportSlides`, as an explicit object rather than closure scope. */
export interface PptxExportContext {
  page: Page
  slides: SlideInfo[]
  /** Canvas width in pixels. */
  width: number
  /** Canvas height in pixels. */
  height: number
  /** The 1-based slide numbers `--range` selected; the same defensive filter the image exporter carries. */
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
  /** Color strings no parser understood, so the user can report them. */
  unparsedColors: string[]
  /** Decorative pseudo-elements whose box could not be resolved. */
  unplaceablePseudos: string[]
  /** The path actually written, extension included. */
  output: string
}

/**
 * Export the deck as PowerPoint with native shapes and editable text. One
 * navigation covers everything: the print route renders every slide and click
 * step into a single tall page, so there is no per-slide loop here and
 * `--with-clicks` needs no special handling.
 */
export async function exportPptxEditable(
  ctx: PptxExportContext,
  output: string,
): Promise<EditableExportResult> {
  await ctx.go('print')

  // Measurement and capture are separate passes, so anything still animating is
  // measured at one frame and photographed at another. Pausing keeps the settled
  // end state; `animation: none` would rewind a fade-in to opacity zero.
  await ctx.page.addStyleTag({
    content: '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }',
  })

  const snapshot = await ctx.page.evaluate(collectSnapshot, {
    containerSelector: '.print-slide-container',
    idAttribute: ID_ATTRIBUTE,
  })

  // Filter before normalizing, so leftover pages cost no measurement or screenshots.
  snapshot.slides = snapshot.slides.filter(slide => ctx.pages.includes(slide.no))

  const notes = new Map<number, string | undefined>()
  ctx.slides.forEach((slide, index) => notes.set(index + 1, slide.note))

  const { slides, rasterRequests, unparsedColors } = normalize(snapshot, { notes })
  const report = await capture(ctx.page, slides, rasterRequests)

  const title = ctx.slides[0]
  // A bundler or CJS interop layer can hand back the constructor itself rather
  // than a namespace with `default` on it.
  const pptxgenjs = await import('pptxgenjs')
  const buffer = await buildPptx(
    pptxgenjs.default ?? (pptxgenjs as unknown as typeof pptxgenjs.default),
    slides,
    {
      width: ctx.width,
      height: ctx.height,
      title: title?.title,
      author: title?.frontmatter?.author,
      subject: title?.frontmatter?.info,
    },
  )

  // Return the path actually written: `exportSlides` prints the path it was given.
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
    // A pptx names fonts, it does not carry them; report what recipients need installed.
    fontsNamed: [...new Set(Object.values(snapshot.fontResolution).filter(Boolean))].sort(),
  }
}

/** Print what the export could not do, after the progress bar has stopped. */
export function reportEditableExport(result: EditableExportResult): void {
  for (const slide of result.fallbackSlides)
    console.warn(yellow(`  slide ${slide.no}: exported as an image (${slide.reason})`))
  if (result.imagesDropped)
    console.warn(yellow(`  ${result.imagesDropped} image(s) could not be read and were left out`))
  if (result.rastersFailed)
    console.warn(yellow(`  ${result.rastersFailed} element(s) could not be captured as a picture and were left out`))
  if (result.unparsedColors.length) {
    console.warn(yellow(`  ${result.unparsedColors.length} color value(s) could not be read, so those fills are missing:`))
    console.warn(dim(`    ${result.unparsedColors.slice(0, 5).join(', ')}`))
  }
  if (result.isolationMissed)
    console.warn(yellow(`  ${result.isolationMissed} picture(s) could not be isolated, so their slide may show doubled text`))
  if (result.unplaceablePseudos.length) {
    console.warn(yellow(`  ${result.unplaceablePseudos.length} CSS decoration(s) could not be placed and were left out:`))
    console.warn(dim(`    ${result.unplaceablePseudos.slice(0, 5).join(', ')}`))
  }
  if (result.fontsNamed.length) {
    console.warn(dim(`  fonts named in this file: ${result.fontsNamed.join(', ')}`))
    console.warn(dim('  a .pptx names fonts rather than embedding them, so recipients need these installed'))
  }
}
