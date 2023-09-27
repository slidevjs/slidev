import path from 'node:path'
import { Buffer } from 'node:buffer'
import fs from 'fs-extra'
import { blue, cyan, dim, green, yellow } from 'kolorist'
import { Presets, SingleBar } from 'cli-progress'
import { parseRangeString } from '@slidev/parser/core'
import type { ExportArgs, SlideInfo, TocItem } from '@slidev/types'
import { outlinePdfFactory } from '@lillallol/outline-pdf'
import * as pdfLib from 'pdf-lib'
import { PDFDocument } from 'pdf-lib'
import type { ResolvedSlidevOptions } from './options'
import { packageExists } from './utils'

export interface ExportOptions {
  total: number
  range?: string
  slides: SlideInfo[]
  port?: number
  base?: string
  format?: 'pdf' | 'png' | 'md'
  output?: string
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
}

function addToTree(tree: TocItem[], info: SlideInfo, slideIndexes: Record<number, number>, level = 1) {
  const titleLevel = info.level
  if (titleLevel && titleLevel > level && tree.length > 0) {
    addToTree(tree[tree.length - 1].children, info, slideIndexes, level + 1)
  }
  else {
    tree.push({
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
  if (!packageExists('playwright-chromium'))
    throw new Error('The exporting for Slidev is powered by Playwright, please install it via `npm i -D playwright-chromium`')

  const { chromium } = await import('playwright-chromium')
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
}: ExportOptions) {
  if (!packageExists('playwright-chromium'))
    throw new Error('The exporting for Slidev is powered by Playwright, please install it via `npm i -D playwright-chromium`')

  const pages: number[] = parseRangeString(total, range)

  const { chromium } = await import('playwright-chromium')
  const browser = await chromium.launch({
    executablePath,
  })
  const context = await browser.newContext({
    viewport: {
      width,
      // Calculate height for every slides to be in the viewport to trigger the rendering of iframes (twitter, youtube...)
      height: perSlide ? height : height * pages.length,
    },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const progress = createSlidevProgress(!perSlide)

  async function go(no: number | string, clicks?: string) {
    const path = `${no}?print${withClicks ? '=clicks' : ''}${clicks ? `&clicks=${clicks}` : ''}${range ? `&range=${range}` : ''}`
    const url = routerMode === 'hash'
      ? `http://localhost:${port}${base}#${path}`
      : `http://localhost:${port}${base}${path}`
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout,
    })
    await page.waitForLoadState('networkidle')
    await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light', media: 'screen' })
    // Check for "data-waitfor" attribute and wait for given element to be loaded
    const elements = page.locator('[data-waitfor]')
    const count = await elements.count()
    for (let index = 0; index < count; index++) {
      const element = elements.nth(index)
      const attribute = await element.getAttribute('data-waitfor')
      if (attribute)
        await element.locator(attribute).waitFor()
    }
    // Wait for frames to load
    const frames = page.frames()
    await Promise.all(frames.map(frame => frame.waitForLoadState()))
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

    const mergedPdf = await PDFDocument.create({})
    for (const pdfBytes of buffers) {
      const pdf = await PDFDocument.load(pdfBytes)
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page)
      })
    }

    const buffer = await mergedPdf.save()
    await fs.writeFile(output, buffer)
  }

  async function genPagePdfOnePiece() {
    await go('print')
    const slideIndexes = await getSlidesIndex()
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

    if (withToc) {
      const outlinePdf = outlinePdfFactory(pdfLib)

      const tocTree = slides.filter(slide => slide.title)
        .reduce((acc: TocItem[], slide) => {
          addToTree(acc, slide, slideIndexes)
          return acc
        }, [])

      const outline = makeOutline(tocTree)

      pdf = await outlinePdf({ outline, pdf })
    }

    pdfData = Buffer.from(await pdf.save())
    await fs.writeFile(output, pdfData)
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

  progress.start(pages.length)

  if (format === 'pdf') {
    await genPagePdf()
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
    format,
    timeout,
    range,
    dark,
    withClicks,
    executablePath,
    withToc,
    perSlide,
  } = config
  outFilename = output || options.data.config.exportFilename || outFilename || `${path.basename(entry, '.md')}-export`
  if (outDir)
    outFilename = path.join(outDir, outFilename)
  return {
    output: outFilename,
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
  }
}
