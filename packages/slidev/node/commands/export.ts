import type { ExportArgs, ResolvedSlidevOptions, SlideInfo, TocItem } from '@slidev/types'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import process from 'node:process'
import { clearUndefined, slash } from '@antfu/utils'
import { outlinePdfFactory } from '@lillallol/outline-pdf'
import { parseRangeString } from '@slidev/parser/core'
import { Presets, SingleBar } from 'cli-progress'
import fs from 'fs-extra'
import { blue, cyan, dim, green, yellow } from 'kolorist'
import { resolve } from 'mlly'
import * as pdfLib from 'pdf-lib'
import { PDFDocument } from 'pdf-lib'
import { getRoots } from '../resolver'

export interface ExportOptions {
  total: number
  range?: string
  slides: SlideInfo[]
  port?: number
  base?: string
  format?: 'pdf' | 'png' | 'pptx' | 'md'
  output?: string
  timeout?: number
  wait?: number
  waitUntil: 'networkidle' | 'load' | 'domcontentloaded' | undefined
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
  omitBackground?: boolean
}

interface ExportPngResult {
  slideIndex: number
  buffer: Buffer
}

function addToTree(tree: TocItem[], info: SlideInfo, slideIndexes: Record<number, number>, level = 1) {
  const titleLevel = info.level
  if (titleLevel && titleLevel > level && tree.length > 0 && tree[tree.length - 1].titleLevel < titleLevel) {
    addToTree(tree[tree.length - 1].children, info, slideIndexes, level + 1)
  }
  else {
    tree.push({
      no: info.index,
      children: [],
      level,
      titleLevel: titleLevel ?? level,
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
  wait?: number
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
  wait = 0,
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

  if (wait)
    await page.waitForTimeout(wait)

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
  slides,
  base = '/',
  timeout = 30000,
  wait = 0,
  dark = false,
  routerMode = 'history',
  width = 1920,
  height = 1080,
  withClicks = false,
  executablePath = undefined,
  withToc = false,
  perSlide = false,
  scale = 1,
  waitUntil,
  omitBackground = false,
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

  async function go(no: number | string, clicks?: string) {
    const query = new URLSearchParams()
    if (withClicks)
      query.set('print', 'clicks')
    else
      query.set('print', 'true')
    if (range)
      query.set('range', range)
    if (clicks)
      query.set('clicks', clicks)

    const url = routerMode === 'hash'
      ? `http://localhost:${port}${base}?${query}#${no}`
      : `http://localhost:${port}${base}${no}?${query}`
    await page.goto(url, {
      waitUntil,
      timeout,
    })
    if (waitUntil)
      await page.waitForLoadState(waitUntil)
    await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light', media: 'screen' })
    const slide = no === 'print'
      ? page.locator('body')
      : page.locator(`[data-slidev-no="${no}"]`)
    await slide.waitFor()

    // Wait for slides to be loaded
    {
      const elements = slide.locator('.slidev-slide-loading')
      const count = await elements.count()
      for (let index = 0; index < count; index++)
        await elements.nth(index).waitFor({ state: 'detached' })
    }
    // Check for "data-waitfor" attribute and wait for given element to be loaded
    {
      const elements = slide.locator('[data-waitfor]')
      const count = await elements.count()
      for (let index = 0; index < count; index++) {
        const element = elements.nth(index)
        const attribute = await element.getAttribute('data-waitfor')
        if (attribute) {
          await element.locator(attribute).waitFor({ state: 'visible' }).catch((e) => {
            console.error(e)
            process.exitCode = 1
          })
        }
      }
    }
    // Wait for frames to load
    {
      const frames = page.frames()
      await Promise.all(frames.map(frame => frame.waitForLoadState()))
    }
    // Wait for Mermaid graphs to be rendered
    {
      const container = slide.locator('#mermaid-rendering-container')
      const count = await container.count()
      if (count > 0) {
        while (true) {
          const element = container.locator('div').first()
          if (await element.count() === 0)
            break
          await element.waitFor({ state: 'detached' })
        }
        await container.evaluate(node => node.style.display = 'none')
      }
    }
    // Hide Monaco aria container
    {
      const elements = slide.locator('.monaco-aria-container')
      const count = await elements.count()
      for (let index = 0; index < count; index++) {
        const element = elements.nth(index)
        await element.evaluate(node => node.style.display = 'none')
      }
    }
    // Wait for the given time
    if (wait)
      await page.waitForTimeout(wait)
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
    return url.match(/clicks=([1-9]\d*)/)?.[1]
  }

  async function genPageWithClicks(
    fn: (no: number, clicks?: string) => Promise<any>,
    no: number,
    clicks?: string,
  ) {
    await fn(no, clicks)
    if (withClicks) {
      await page.keyboard.press('ArrowRight', { delay: 100 })
      const _clicks = getClicksFromUrl(page.url())
      if (_clicks && clicks !== _clicks)
        await genPageWithClicks(fn, no, _clicks)
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
  }

  async function genPagePngOnePiece(writeToDisk: boolean) {
    const result: ExportPngResult[] = []
    await go('print')
    await fs.emptyDir(output)
    const slideContainers = page.locator('.print-slide-container')
    const count = await slideContainers.count()
    for (let i = 0; i < count; i++) {
      progress.update(i + 1)
      const id = (await slideContainers.nth(i).getAttribute('id')) || ''
      const slideNo = +id.split('-')[0]
      const buffer = await slideContainers.nth(i).screenshot({
        omitBackground,
      })
      result.push({ slideIndex: slideNo - 1, buffer })
      if (writeToDisk)
        await fs.writeFile(path.join(output, `${withClicks ? id : slideNo}.png`), buffer)
    }
    return result
  }

  async function genPagePngPerSlide(writeToDisk: boolean) {
    const result: ExportPngResult[] = []
    const genScreenshot = async (no: number, clicks?: string) => {
      await go(no, clicks)
      const buffer = await page.screenshot({
        omitBackground,
      })
      result.push({ slideIndex: no - 1, buffer })
      if (writeToDisk) {
        await fs.writeFile(
          path.join(output, `${no.toString().padStart(2, '0')}${clicks ? `-${clicks}` : ''}.png`),
          buffer,
        )
      }
    }
    for (const no of pages)
      await genPageWithClicks(genScreenshot, no)
    return result
  }

  function genPagePdf() {
    if (!output.endsWith('.pdf'))
      output = `${output}.pdf`
    return perSlide
      ? genPagePdfPerSlide()
      : genPagePdfOnePiece()
  }

  function genPagePng(writeToDisk = true) {
    return perSlide
      ? genPagePngPerSlide(writeToDisk)
      : genPagePngOnePiece(writeToDisk)
  }

  async function genPageMd() {
    const files = await fs.readdir(output)
    const mds: string[] = files.map((file, i, files) => {
      const slideIndex = getSlideIndex(file)
      const mdImg = `![${slides[slideIndex]?.title}](./${slash(path.join(output, file))})\n\n`
      if ((i + 1 === files.length || getSlideIndex(files[i + 1]) !== slideIndex) && slides[slideIndex]?.note)
        return `${mdImg}${slides[slideIndex]?.note}\n\n`
      return mdImg
    })

    if (!output.endsWith('.md'))
      output = `${output}.md`
    await fs.writeFile(output, mds.join(''))
  }

  // Ported from https://github.com/marp-team/marp-cli/blob/main/src/converter.ts
  async function genPagePptx(pngs: ExportPngResult[]) {
    const { default: PptxGenJS } = await import('pptxgenjs')
    const pptx = new PptxGenJS()

    const layoutName = `${width}x${height}`
    pptx.defineLayout({
      name: layoutName,
      width: width / 96,
      height: height / 96,
    })
    pptx.layout = layoutName

    const titleSlide = slides[0]
    pptx.author = titleSlide?.frontmatter?.author
    pptx.company = 'Created using Slidev'
    if (titleSlide?.title)
      pptx.title = titleSlide?.title
    if (titleSlide?.frontmatter?.info)
      pptx.subject = titleSlide?.frontmatter?.info

    pngs.forEach(({ slideIndex, buffer }) => {
      const slide = pptx.addSlide()
      slide.background = {
        data: `data:image/png;base64,${buffer.toString('base64')}`,
      }

      const note = slides[slideIndex].note
      if (note)
        slide.addNotes(note)
    })

    const buffer = await pptx.write({
      outputType: 'nodebuffer',
    }) as Buffer
    if (!output.endsWith('.pptx'))
      output = `${output}.pptx`
    await fs.writeFile(output, buffer)
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

  if (format === 'pdf') {
    await genPagePdf()
  }
  else if (format === 'png') {
    await genPagePng()
  }
  else if (format === 'md') {
    await genPagePng()
    await genPageMd()
  }
  else if (format === 'pptx') {
    const buffers = await genPagePng(false)
    await genPagePptx(buffers)
  }
  else {
    throw new Error(`Unsupported exporting format "${format}"`)
  }

  progress.stop()
  browser.close()
  return output
}

export function getExportOptions(args: ExportArgs, options: ResolvedSlidevOptions, outDir?: string, outFilename?: string): Omit<ExportOptions, 'port' | 'base'> {
  const config = {
    ...options.data.config.export,
    ...args,
    ...clearUndefined({
      waitUntil: args['wait-until'],
      withClicks: args['with-clicks'],
      executablePath: args['executable-path'],
      withToc: args['with-toc'],
      perSlide: args['per-slide'],
      omitBackground: args['omit-background'],
    }),
  }
  const {
    entry,
    output,
    format,
    timeout,
    wait,
    waitUntil,
    range,
    dark,
    withClicks,
    executablePath,
    withToc,
    perSlide,
    scale,
    omitBackground,
  } = config
  outFilename = output || options.data.config.exportFilename || outFilename || `${path.basename(entry, '.md')}-export`
  if (outDir)
    outFilename = path.join(outDir, outFilename)
  return {
    output: outFilename,
    slides: options.data.slides,
    total: options.data.slides.length,
    range,
    format: (format || 'pdf') as 'pdf' | 'png' | 'pptx' | 'md',
    timeout: timeout ?? 30000,
    wait: wait ?? 0,
    waitUntil: waitUntil === 'none' ? undefined : (waitUntil ?? 'networkidle') as 'networkidle' | 'load' | 'domcontentloaded',
    dark: dark || options.data.config.colorSchema === 'dark',
    routerMode: options.data.config.routerMode,
    width: options.data.config.canvasWidth,
    height: Math.round(options.data.config.canvasWidth / options.data.config.aspectRatio),
    withClicks: withClicks ?? format === 'pptx',
    executablePath,
    withToc: withToc || false,
    perSlide: perSlide || false,
    scale: scale || 2,
    omitBackground: omitBackground ?? false,
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
