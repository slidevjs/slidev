import path from 'node:path'
import { Buffer } from 'node:buffer'
import fs from 'fs-extra'
import { blue, cyan, dim, green, yellow } from 'kolorist'
import { Presets, SingleBar } from 'cli-progress'
import { parseRangeString } from '@slidev/parser/core'
import type { ExportArgs, ResolvedSlidevOptions, SlideInfo, TocItem } from '@slidev/types'
import { outlinePdfFactory } from '@lillallol/outline-pdf'
import * as pdfLib from 'pdf-lib'
import type { PDFRef } from 'pdf-lib'
import { PDFDict, PDFDocument, PDFName, PDFString, PageSizes, asPDFName, rgb } from 'pdf-lib'
import { resolve } from 'mlly'
import { getRoots } from '../resolver'

export interface ExportOptions {
  total: number
  range?: string
  slides: SlideInfo[]
  port?: number
  base?: string
  format?: 'pdf' | 'png' | 'md'
  output?: string
  handout?: boolean,
  cover?: boolean,
  timeout?: number
  dark?: boolean
  routerMode?: 'hash' | 'history'
  width?: number
  height?: number
  withClicks?: boolean
  executablePath?: string
  withToc?: boolean
  /**
   * Render slides slide by slide. Works better with global components, but will break cross slide links and TOC in PDF.
   * @default false
   */
  perSlide?: boolean
  scale?: number
}

function addToTree(tree: TocItem[], info: SlideInfo, slideIndexes: Record<number, number>, level = 1) {
  const titleLevel = info.level
  if (titleLevel && titleLevel > level && tree.length > 0) {
    addToTree(tree[tree.length - 1].children, info, slideIndexes, level + 1)
  }
  else {
    tree.push({
      no: info.index,
      children: [],
      level,
      path: String(slideIndexes[info.index + 1]),
      hideInToc: Boolean(info.frontmatter?.hideInToc),
      title: info.title,
    })
  }
}

function makeOutline(tree: TocItem[]): string {
  return tree.map(({ title, path, level, children }) => {
    const rootOutline = title ? `${path}|${'-'.repeat(level - 1)}|${title}` : null

    const childrenOutline = makeOutline(children)

    return childrenOutline.length > 0 ? `${rootOutline}\n${childrenOutline}` : rootOutline
  }).filter(outline => !!outline).join('\n')
}

export interface ExportNotesOptions {
  port?: number
  base?: string
  output?: string
  timeout?: number
}

function createSlidevProgress(indeterminate = false) {
  function getSpinner(n = 0) {
    return [cyan('●'), green('◆'), blue('■'), yellow('▲')][n % 4]
  }
  let current = 0
  let spinner = 0
  let timer: any

  const progress = new SingleBar({
    clearOnComplete: true,
    hideCursor: true,
    format: `  {spin} ${yellow('rendering')}${indeterminate ? dim(yellow('...')) : ' {bar} {value}/{total}'}`,
    linewrap: false,
    barsize: 30,
  }, Presets.shades_grey)

  return {
    bar: progress,
    start(total: number) {
      progress.start(total, 0, { spin: getSpinner(spinner) })
      timer = setInterval(() => {
        spinner += 1
        progress.update(current, { spin: getSpinner(spinner) })
      }, 200)
    },
    update(v: number) {
      current = v
      progress.update(v, { spin: getSpinner(spinner) })
    },
    stop() {
      clearInterval(timer)
      progress.stop()
    },
  }
}

export async function exportNotes({
  port = 18724,
  base = '/',
  output = 'notes',
  timeout = 30000,
}: ExportNotesOptions): Promise<string> {
  const { chromium } = await importPlaywright()
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  const progress = createSlidevProgress(true)

  progress.start(1)

  if (!output.endsWith('.pdf'))
    output = `${output}.pdf`

  await page.goto(`http://localhost:${port}${base}presenter/print`, { waitUntil: 'networkidle', timeout })
  await page.waitForLoadState('networkidle')
  await page.emulateMedia({ media: 'screen' })

  await page.pdf({
    path: output,
    margin: {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    },
    printBackground: true,
    preferCSSPageSize: true,
  })

  progress.stop()
  browser.close()

  return output
}

export async function exportSlides({
  port = 18724,
  total = 0,
  range,
  format = 'pdf',
  output = 'slides',
  handout = false,
  cover = false,
  slides,
  base = '/',
  timeout = 30000,
  dark = false,
  routerMode = 'history',
  width = 1920,
  height = 1080,
  withClicks = false,
  executablePath = undefined,
  withToc = false,
  perSlide = false,
  scale = 1,
}: ExportOptions) {
  const pages: number[] = parseRangeString(total, range)

  const { chromium } = await importPlaywright()
  const browser = await chromium.launch({
    executablePath,
  })
  const context = await browser.newContext({
    viewport: {
      width,
      // Calculate height for every slides to be in the viewport to trigger the rendering of iframes (twitter, youtube...)
      height: perSlide ? height : height * pages.length,
    },
    deviceScaleFactor: scale,
  })
  const page = await context.newPage()
  const progress = createSlidevProgress(!perSlide)

  async function go(no: number | string, clicks?: string, query = 'print') {
    const path = `${no}?${query}${withClicks ? '=clicks' : ''}${clicks ? `&clicks=${clicks}` : ''}${range ? `&range=${range}` : ''}`
    const url = routerMode === 'hash'
      ? `http://localhost:${port}${base}#${path}`
      : `http://localhost:${port}${base}${path}`
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout,
    })
    await page.waitForLoadState('networkidle')
    await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light', media: 'screen' })
    // Wait for slides to be loaded
    {
      const elements = page.locator('.slidev-slide-loading')
      const count = await elements.count()
      for (let index = 0; index < count; index++)
        await elements.nth(index).waitFor({ state: 'detached' })
    }
    // Check for "data-waitfor" attribute and wait for given element to be loaded
    {
      const elements = page.locator('[data-waitfor]')
      const count = await elements.count()
      for (let index = 0; index < count; index++) {
        const element = elements.nth(index)
        const attribute = await element.getAttribute('data-waitfor')
        if (attribute)
          await element.locator(attribute).waitFor()
      }
    }
    // Wait for frames to load
    {
      const frames = page.frames()
      await Promise.all(frames.map(frame => frame.waitForLoadState()))
    }
    // Wait for Mermaid graphs to be rendered
    {
      const container = page.locator('#mermaid-rendering-container')
      while (true) {
        const element = container.locator('div').first()
        if (await element.count() === 0)
          break
        await element.waitFor({ state: 'detached' })
      }
      await container.evaluate(node => node.style.display = 'none')
    }
    // Hide Monaco aria container
    {
      const elements = page.locator('.monaco-aria-container')
      const count = await elements.count()
      for (let index = 0; index < count; index++) {
        const element = elements.nth(index)
        await element.evaluate(node => node.style.display = 'none')
      }
    }
  }

  async function getSlidesIndex() {
    const clicksBySlide: Record<string, number> = {}
    const slides = page.locator('.print-slide-container')
    const count = await slides.count()
    for (let i = 0; i < count; i++) {
      const id = (await slides.nth(i).getAttribute('id')) || ''
      const path = Number(id.split('-')[0])
      clicksBySlide[path] = (clicksBySlide[path] || 0) + 1
    }

    const slideIndexes = Object.fromEntries(Object.entries(clicksBySlide)
      .reduce<[string, number][]>((acc, [path, clicks], i) => {
        acc.push([path, clicks + (acc[i - 1]?.[1] ?? 0)])
        return acc
      }, []))
    return slideIndexes
  }

  function getClicksFromUrl(url: string) {
    return url.match(/clicks=([1-9][0-9]*)/)?.[1]
  }

  async function genPageWithClicks(
    fn: (i: number, clicks?: string) => Promise<any>,
    i: number,
    clicks?: string,
  ) {
    await fn(i, clicks)
    if (withClicks) {
      await page.keyboard.press('ArrowRight', { delay: 100 })
      const _clicks = getClicksFromUrl(page.url())
      if (_clicks && clicks !== _clicks)
        await genPageWithClicks(fn, i, _clicks)
    }
  }

  async function genPagePdfPerSlide() {
    const buffers: Buffer[] = []
    const genPdfBuffer = async (i: number, clicks?: string) => {
      await go(i, clicks)
      const pdf = await page.pdf({
        width,
        height,
        margin: {
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
        },
        pageRanges: '1',
        printBackground: true,
        preferCSSPageSize: true,
      })
      buffers.push(pdf)
    }
    let idx = 0
    for (const i of pages) {
      await genPageWithClicks(genPdfBuffer, i)
      progress.update(++idx)
    }

    let mergedPdf = await PDFDocument.create({})
    for (const pdfBytes of buffers) {
      const pdf = await PDFDocument.load(pdfBytes)
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page)
      })
    }

    // Edit generated PDF: add metadata and (optionally) TOC
    addPdfMetadata(mergedPdf)

    if (withToc)
      mergedPdf = await addTocToPdf(mergedPdf)

    const buffer = await mergedPdf.save()
    await fs.writeFile(output, buffer)
    return output
  }

  async function genPagePdfOnePiece() {
    await go('print')
    await page.pdf({
      path: output,
      width,
      height,
      margin: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
      },
      printBackground: true,
      preferCSSPageSize: true,
    })

    // Edit generated PDF: add metadata and (optionally) TOC
    let pdfData = await fs.readFile(output)
    let pdf = await PDFDocument.load(pdfData)

    addPdfMetadata(pdf)

    if (withToc)
      pdf = await addTocToPdf(pdf)

    pdfData = Buffer.from(await pdf.save())
    await fs.writeFile(output, pdfData)
    return output
  }

  async function genPagePngOnePiece() {
    await go('print')
    await fs.emptyDir(output)
    const slides = await page.locator('.print-slide-container')
    const count = await slides.count()
    for (let i = 0; i < count; i++) {
      progress.update(i + 1)
      let id = (await slides.nth(i).getAttribute('id')) || ''
      id = withClicks ? id : id.split('-')[0]
      const buffer = await slides.nth(i).screenshot()
      await fs.writeFile(path.join(output, `${id}.png`), buffer)
    }
  }

  async function genPagePngPerSlide() {
    const genScreenshot = async (i: number, clicks?: string) => {
      await go(i, clicks)
      await page.screenshot({
        omitBackground: false,
        path: path.join(
          output,
          `${i.toString().padStart(2, '0')}${clicks ? `-${clicks}` : ''}.png`,
        ),
      })
    }
    for (const i of pages)
      await genPageWithClicks(genScreenshot, i)
  }

  async function genNotesPdfOnePiece() {

    const baseName = output.replace('.pdf', '')
    const output_notes = `${baseName}-notes.pdf`

    await go('handout')
    await page.pdf({
      path: output_notes,
      width,
      height,
      margin: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
      },
      printBackground: true,
      preferCSSPageSize: true,
    })

    return output_notes
  }

  async function genCoverPdfOnePiece() {

    const baseName = output.replace('.pdf', '')
    const output_notes = `${baseName}-cover.pdf`

    await go('cover')
    await page.pdf({
      path: output_notes,
      width,
      height,
      margin: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
      },
      printBackground: true,
      preferCSSPageSize: true,
    })
    return output_notes
  }

  const createPageLinkAnnotation = (
    page: pdfLib.PDFPage,
    uri: string,
    llx = 0,
    lly = 30,
    urx = 40,
    ury = 230
  ) =>
    page.doc.context.register(
      page.doc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [llx, lly, urx, ury],
        Border: [0, 0, 0],
        C: [0, 0, 1],
        A: {
          Type: "Action",
          S: "URI",
          URI: PDFString.of(uri),
        },
      })
    )

  async function mergeSlidesWithNotes(
    slides: pdfLib.PDFDocument,
    pdfNotes: pdfLib.PDFDocument,
    pdfCover: pdfLib.PDFDocument | undefined
  ) {
    const pdfSlidePages = slides.getPages()
    const numSlides = pdfSlidePages.length

    const pdf = await PDFDocument.create()

    if (pdfCover) {
      for (let i = 0; i < pdfCover.getPages().length; i++) {
        const coverPage = pdf.addPage(PageSizes.A4)
        const coverEmbedded = await pdf.embedPage(pdfCover.getPages()[i])
        const coverEmbeddedDims = coverEmbedded.scale(1)
        coverPage.drawPage(coverEmbedded, {
          ...coverEmbeddedDims,
          x: coverPage.getWidth() / 2 - coverEmbeddedDims.width / 2,
          y: 0,
        })
      }
    }

    const notesPages = pdfNotes.getPages()

    for (let i = 0; i < numSlides; i++) {
      const slideEmbedded = await pdf.embedPage(pdfSlidePages[i])
      const slideEmbeddedDims = slideEmbedded.scale(0.72)

      const currentPage = pdf.addPage(PageSizes.A4)

      //firstPage.drawPage(slideEmbedded as pdfLib.PDFEmbeddedPage, {
      currentPage.drawPage(slideEmbedded, {
        ...slideEmbeddedDims,
        x: currentPage.getWidth() / 2 - slideEmbeddedDims.width / 2,
        y: currentPage.getHeight() - slideEmbeddedDims.height - 30,
        width: slideEmbeddedDims.width,
        height: slideEmbeddedDims.height,
      })

      currentPage.drawRectangle({
        x: currentPage.getWidth() / 2 - slideEmbeddedDims.width / 2,
        y: currentPage.getHeight() - slideEmbeddedDims.height - 30,
        width: slideEmbeddedDims.width,
        height: slideEmbeddedDims.height,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.1,
      })

      let noteEmbeddedDims: {
        width: number;
        height: number;
      }

      /* add notes */
      try {
        const noteEmbedded = await pdf.embedPage(notesPages[i], {
          left: 0,
          bottom: 0,
          right: 600,
          top: 530,
        })

        noteEmbeddedDims = noteEmbedded.scale(0.93)

        currentPage.drawPage(noteEmbedded, {
          ...noteEmbeddedDims,
          x: currentPage.getWidth() / 2 - noteEmbeddedDims.width / 2,
          y: 0,
        })
      } catch (error) {
        console.error(`Could not embed note as page does not exist: ${error}`)
      }

      /* add links for slides */
      const annots = pdfSlidePages[i].node.Annots()

      const newLinkAnnotations: PDFRef[] = []; // Initialize an empty array to accumulate new link annotations

      try {
        annots?.asArray().forEach((a) => {

          const dict = slides.context.lookupMaybe(a, PDFDict)
          if (!dict) return

          const aRecord = dict.get(asPDFName(`A`))
          if (!aRecord) return

          const subtype = dict.get(PDFName.of("Subtype"))?.toString()
          if (!subtype) return

          if (subtype === "/Link") {
            const rect = dict.get(PDFName.of("Rect"))!
            const link = slides.context.lookupMaybe(aRecord, PDFDict)
            if (!link) return

            const uri = link.get(asPDFName("URI"))!.toString().slice(1, -1) // get the original link, remove parenthesis

            const scale = slideEmbeddedDims.width / pdfSlidePages[i].getWidth(); // Calculate scale based on the width (or height)
            const offsetX =
              currentPage.getWidth() / 2 - slideEmbeddedDims.width / 2
            const offsetY =
              currentPage.getHeight() - slideEmbeddedDims.height - 30

            // @ts-expect-error missing types
            const newRect = rect.array.map((value, index) => {
              if (index % 2 === 0) {
                // x values (llx, urx)
                return value * scale + offsetX
              } else {
                // y values (lly, ury)
                // Y values need to be inverted due to PDF's coordinate system (0 at bottom)

                const scaledY = (pdfSlidePages[i].getHeight() - value) * scale
                // Then, adjust for the slide's position on the page, considering the slide is at the top
                return offsetY - scaledY + slideEmbeddedDims.height
              }
            })

            const newLink = createPageLinkAnnotation(
              currentPage,
              uri,
              newRect[0], // llx
              newRect[1], // lly
              newRect[2], // urx
              newRect[3], // ury
            )
            newLinkAnnotations.push(newLink)
          }
        })


      } catch (e) {
        console.error(e)
      }

      /* add links for handouts */
      const notesAnnots = notesPages[i]?.node.Annots()
      try {
        notesAnnots?.asArray().forEach((a) => {
          let dict: PDFDict | undefined
          try {
            dict = pdfNotes.context.lookupMaybe(a, PDFDict)
          } catch (e) {
          }

          if (!dict) return

          const aRecord = dict.get(PDFName.of(`A`))
          const subtype = dict.get(PDFName.of("Subtype"))?.toString()

          if (subtype === "/Link") {
            const rect = dict.get(PDFName.of("Rect"))!
            const link = pdfNotes.context.lookupMaybe(aRecord, PDFDict)!
            const uri = link.get(PDFName.of("URI"))!.toString().slice(1, -1)

            const scale = noteEmbeddedDims.width / notesPages[i].getWidth()
            const offsetX = currentPage.getWidth() / 2 - noteEmbeddedDims.width / 2
            const offsetY = 0; // Notes are drawn at the bottom, so offsetY is 0

            // @ts-expect-error missing types
            const newRect = rect.array.map((value, index) => {
              if (index % 2 === 0) {
                return value * scale + offsetX; // x values
              } else {
                // y values need to be adjusted differently for notes
                return -2 + offsetY + value * scale; // Adjust y values for position
              }
            })

            const newLink = createPageLinkAnnotation(
              currentPage,
              uri,
              newRect[0], // llx
              newRect[1], // lly
              newRect[2], // urx
              newRect[3] // ury
            )
            newLinkAnnotations.push(newLink)
          }
        })


      } catch (e) {
        console.error(e)
      }

      if (newLinkAnnotations.length > 0) {
        currentPage.node.set(
          PDFName.of("Annots"),
          pdf.context.obj(newLinkAnnotations)
        )
      }
    }

    return pdf
  }


  async function genHandoutAndMerge(pdfSlidesPath: string) {
    if (format !== 'pdf')
      throw new Error(`Unsupported exporting format for handout "${format}"`)

    /* 1. Read generated slides */
    const slidesData = await fs.readFile(pdfSlidesPath)
    const pdfSlides = await PDFDocument.load(slidesData)

    /* 2. Generate notes pdf */
    const notesPath = await genNotesPdfOnePiece()
    const notesData = await fs.readFile(notesPath)
    const pdfNotes = await PDFDocument.load(notesData)

    /* 3. Generate cover pdf */
    let pdfCover
    let coverPath
    if (cover) {
      coverPath = await genCoverPdfOnePiece()
      const coverData = await fs.readFile(coverPath)
      pdfCover = await PDFDocument.load(coverData)
    }

    const pdf = await mergeSlidesWithNotes(pdfSlides, pdfNotes, pdfCover)

    /* cleanup*/
    await fs.unlink(notesPath)
    if (cover && coverPath) await fs.unlink(coverPath)

    if (!pdf)
      throw new Error('PDF could not be generated')

    {
      const titleSlide = slides[0]
      if (titleSlide?.title)
        pdf.setTitle(titleSlide.title)
      if (titleSlide?.frontmatter?.info)
        pdf.setSubject(titleSlide.frontmatter.info)
      if (titleSlide?.frontmatter?.author)
        pdf.setAuthor(titleSlide.frontmatter.author)
      if (titleSlide?.frontmatter?.keywords) {
        if (Array.isArray(titleSlide?.frontmatter?.keywords))
          pdf.setKeywords(titleSlide?.frontmatter?.keywords)
        else
          pdf.setKeywords(titleSlide?.frontmatter?.keywords.split(','))
      }
    }

    const pdfData = Buffer.from(await pdf.save())
    const baseName = output.replace('.pdf', '')
    const handOut = `${baseName}-handout.pdf`

    await fs.writeFile(handOut, pdfData)
  }

  function genPagePdf() {
    if (!output.endsWith('.pdf'))
      output = `${output}.pdf`
    return perSlide
      ? genPagePdfPerSlide()
      : genPagePdfOnePiece()
  }

  function genPagePng() {
    return perSlide
      ? genPagePngPerSlide()
      : genPagePngOnePiece()
  }

  async function genPageMd(slides: SlideInfo[]) {
    const files = await fs.readdir(output)
    const mds: string[] = files.map((file, i, files) => {
      const slideIndex = getSlideIndex(file)
      const mdImg = `![${slides[slideIndex]?.title}](./${path.join(output, file)})\n\n`
      if ((i + 1 === files.length || getSlideIndex(files[i + 1]) !== slideIndex) && slides[slideIndex]?.note)
        return `${mdImg}${slides[slideIndex]?.note}\n\n`
      return mdImg
    })

    if (!output.endsWith('.md'))
      output = `${output}.md`
    await fs.writeFile(output, mds.join(''))
  }

  function getSlideIndex(file: string): number {
    const slideId = file.substring(0, file.indexOf('.')).split('-')[0]
    return Number(slideId) - 1
  }

  // Adds metadata (title, author, keywords) to PDF document, mutating it
  function addPdfMetadata(pdf: PDFDocument): void {
    const titleSlide = slides[0]
    if (titleSlide?.title)
      pdf.setTitle(titleSlide.title)
    if (titleSlide?.frontmatter?.info)
      pdf.setSubject(titleSlide.frontmatter.info)
    if (titleSlide?.frontmatter?.author)
      pdf.setAuthor(titleSlide.frontmatter.author)
    if (titleSlide?.frontmatter?.keywords) {
      if (Array.isArray(titleSlide?.frontmatter?.keywords))
        pdf.setKeywords(titleSlide?.frontmatter?.keywords)
      else
        pdf.setKeywords(titleSlide?.frontmatter?.keywords.split(','))
    }
  }

  async function addTocToPdf(pdf: PDFDocument): Promise<PDFDocument> {
    const outlinePdf = outlinePdfFactory(pdfLib)
    const slideIndexes = await getSlidesIndex()

    const tocTree = slides.filter(slide => slide.title)
      .reduce((acc: TocItem[], slide) => {
        addToTree(acc, slide, slideIndexes)
        return acc
      }, [])

    const outline = makeOutline(tocTree)

    return await outlinePdf({ outline, pdf })
  }

  progress.start(pages.length)

  let pdfSlidesPath

  if (format === 'pdf') {
    pdfSlidesPath = await genPagePdf()
  }
  else if (format === 'png') {
    await genPagePng()
  }
  else if (format === 'md') {
    await genPagePng()
    await genPageMd(slides)
  }
  else {
    throw new Error(`Unsupported exporting format "${format}"`)
  }

  if (pdfSlidesPath && handout)
    await genHandoutAndMerge(pdfSlidesPath)

  progress.stop()
  browser.close()
  return output
}

export function getExportOptions(args: ExportArgs, options: ResolvedSlidevOptions, outDir?: string, outFilename?: string): Omit<ExportOptions, 'port' | 'base'> {
  const config = {
    ...options.data.config.export,
    ...args,
    withClicks: args['with-clicks'],
    executablePath: args['executable-path'],
    withToc: args['with-toc'],
    perSlide: args['per-slide'],
  }
  const {
    entry,
    output,
    handout,
    cover,
    format,
    timeout,
    range,
    dark,
    withClicks,
    executablePath,
    withToc,
    perSlide,
    scale,
  } = config
  outFilename = output || options.data.config.exportFilename || outFilename || `${path.basename(entry, '.md')}-export`
  if (outDir)
    outFilename = path.join(outDir, outFilename)
  return {
    output: outFilename,
    handout: handout || false,
    cover: cover || false,
    slides: options.data.slides,
    total: options.data.slides.length,
    range,
    format: (format || 'pdf') as 'pdf' | 'png' | 'md',
    timeout: timeout ?? 30000,
    dark: dark || options.data.config.colorSchema === 'dark',
    routerMode: options.data.config.routerMode,
    width: options.data.config.canvasWidth,
    height: Math.round(options.data.config.canvasWidth / options.data.config.aspectRatio),
    withClicks: withClicks || false,
    executablePath,
    withToc: withToc || false,
    perSlide: perSlide || false,
    scale: scale || 1,
  }
}

async function importPlaywright(): Promise<typeof import('playwright-chromium')> {
  const { userRoot, userWorkspaceRoot } = await getRoots()

  // 1. resolve from user root
  try {
    return await import(await resolve('playwright-chromium', { url: userRoot }))
  }
  catch { }

  // 2. resolve from user workspace root
  if (userWorkspaceRoot !== userRoot) {
    try {
      return await import(await resolve('playwright-chromium', { url: userWorkspaceRoot }))
    }
    catch { }
  }

  // 3. resolve from global registry
  const { resolveGlobal } = await import('resolve-global')
  try {
    const imported = await import(resolveGlobal('playwright-chromium'))
    return imported.default ?? imported
  }
  catch { }

  // 4. resolve from current @slidev/cli installation
  try {
    return await import('playwright-chromium')
  }
  catch { }

  throw new Error('The exporting for Slidev is powered by Playwright, please install it via `npm i -D playwright-chromium`')
}
