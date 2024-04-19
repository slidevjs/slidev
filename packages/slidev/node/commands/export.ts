import path from 'node:path'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import fs from 'fs-extra'
import { blue, cyan, dim, green, yellow } from 'kolorist'
import { Presets, SingleBar } from 'cli-progress'
import { clearUndefined, ensureSuffix } from '@antfu/utils'
import { parseRangeString } from '@slidev/parser/core'
import type { ExportArgs, ResolvedSlidevOptions, SlideInfo, TocItem } from '@slidev/types'
import { outlinePdfFactory } from '@lillallol/outline-pdf'
import * as pdfLib from 'pdf-lib'
import { PDFDocument } from 'pdf-lib'
import { resolve } from 'mlly'
import { getRoots } from '../resolver'

export interface ExportOptions {
  slides: SlideInfo[]
  total: number
  range: string
  port: number
  base: string
  format: 'pdf' | 'png' | 'md'
  template: string
  output: string
  timeout: number
  wait: number
  dark: boolean
  routerMode: 'hash' | 'history'
  withClicks: boolean
  executablePath: string | undefined
  withToc: boolean
  /**
   * Render slides slide by slide. Works better with global components, but will break cross slide links and TOC in PDF.
   * @default false
   */
  perSlide: boolean
  scale: number
}

function makeOutline(tree: TocItem[]): string {
  return tree.map(({ title, no, level, children }) => {
    const rootOutline = title ? `${no}|${'-'.repeat(level - 1)}|${title}` : null
    const childrenOutline = makeOutline(children)
    return childrenOutline ? `${rootOutline}\n${childrenOutline}` : rootOutline
  }).filter(Boolean).join('\n')
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

export async function exportSlides({
  port,
  total,
  range,
  format,
  output,
  slides,
  base,
  timeout,
  wait,
  dark,
  routerMode,
  withClicks,
  executablePath,
  withToc,
  perSlide,
  scale,
}: ExportOptions) {
  const pages = parseRangeString(total, range)

  const { chromium } = await importPlaywright()
  const browser = await chromium.launch({
    executablePath,
  })
  const context = await browser.newContext({
    deviceScaleFactor: scale,
  })
  const page = await context.newPage()
  page.setDefaultNavigationTimeout(timeout)
  await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light', media: 'screen' })

  const progress = createSlidevProgress(!perSlide)

  async function gotoPrintPage() {
    let query = 'print'
    if (range)
      query += `&range=${range}`
    if (withClicks)
      query += `&with-clicks`
    if (perSlide)
      query += `&per-slide`

    const url = `http://localhost:${port}${base}${routerMode === 'hash' ? '#' : ''}print?${query}`
    await page.goto(url)
    await waitForReady()
  }

  async function waitForReady() {
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
        if (attribute) {
          await element.locator(attribute).waitFor({ state: 'visible' })
            .catch((e) => {
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
      const container = page.locator('#mermaid-rendering-container')
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
      const elements = page.locator('.monaco-aria-container')
      const count = await elements.count()
      for (let index = 0; index < count; index++) {
        const element = elements.nth(index)
        await element.evaluate(node => node.style.display = 'none')
      }
    }
    // TODO: make this configurable
    page.waitForLoadState('networkidle')
    // Wait for the given time
    if (wait)
      await page.waitForTimeout(wait)
  }

  async function perSlideNext() {
    const suffix = withClicks ? '' : 'Slide'
    const hasNext = await page.evaluate(`__slidev__.nav.hasNext${suffix}`)
    if (!hasNext)
      return false
    await page.evaluate(`__slidev__.nav.next${suffix}()`)
    return true
  }

  async function genPagePdfPerSlide() {
    progress.start(pages.length)
    const mergedPdf = await PDFDocument.create()
    while (true) {
      const currentPage = await page.evaluate<number>(`__slidev__.nav.currentSlideNo`)
      const indexInRange = pages.indexOf(currentPage)
      if (indexInRange !== -1) {
        await waitForReady()
        const pdfBuffer = await page.pdf({
          pageRanges: '1',
          printBackground: true,
          preferCSSPageSize: true,
        })
        const [pdfPage] = await mergedPdf.copyPages(await PDFDocument.load(pdfBuffer), [0])
        mergedPdf.addPage(pdfPage)
        progress.update(indexInRange + 1)
      }
      if (!await perSlideNext())
        break
    }
    return mergedPdf
  }

  async function genPagePdfOnePiece() {
    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    })
    return await PDFDocument.load(pdfBuffer)
  }

  async function savePdf(pdf: PDFDocument) {
    if (withToc)
      pdf = await addTocToPdf(pdf)
    addPdfMetadata(pdf)
    await fs.writeFile(output, Buffer.from(await pdf.save()))
  }

  async function genPagePngOnePiece() {
    // await go('print')
    // await fs.emptyDir(output)
    // const slides = page.locator('.print-slide-container')
    // const count = await slides.count()
    // for (let i = 0; i < count; i++) {
    //   progress.update(i + 1)
    //   let id = (await slides.nth(i).getAttribute('id')) || ''
    //   id = withClicks ? id : id.split('-')[0]
    //   const buffer = await slides.nth(i).screenshot()
    //   await fs.writeFile(path.join(output, `${id}.png`), buffer)
    // }
  }

  async function genPagePngPerSlide() {
    // const genScreenshot = async (i: number, clicks?: string) => {
    //   await go(i, clicks)
    //   await page.screenshot({
    //     omitBackground: false,
    //     path: path.join(
    //       output,
    //       `${i.toString().padStart(2, '0')}${clicks ? `-${clicks}` : ''}.png`,
    //     ),
    //   })
    // }
    // for (const i of pages)
    //   await genPageWithClicks(genScreenshot, i)
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
    const tocTree = await page.evaluate('__slidev__.nav.tocTree') as TocItem[]
    const outline = makeOutline(tocTree)
    return await outlinePdf({ outline, pdf })
  }

  await gotoPrintPage()
  if (format === 'pdf') {
    await savePdf(
      perSlide
        ? await genPagePdfPerSlide()
        : await genPagePdfOnePiece(),
    )
  }
  else {
    if (perSlide)
      await genPagePngPerSlide()
    else await genPagePngOnePiece()
    if (format === 'md')
      await genPageMd(slides)
  }

  progress.stop()
  browser.close()
  return output
}

export function getExportOptions(args: ExportArgs, options: ResolvedSlidevOptions, outDir?: string): Omit<ExportOptions, 'port'> {
  const config = {
    ...options.data.config.export,
    ...args,
    ...clearUndefined({
      withClicks: args['with-clicks'],
      executablePath: args['executable-path'],
      withToc: args['with-toc'],
      perSlide: args['per-slide'],
    }),
  }
  const {
    entry,
    output,
    format,
    template,
    base,
    timeout,
    wait,
    range,
    dark,
    withClicks,
    executablePath,
    withToc,
    perSlide,
    scale,
  } = config
  let outFilename = output || options.data.config.exportFilename || `${path.basename(entry, '.md')}-export${template === 'default' ? '' : `-${template}`}`
  outFilename = ensureSuffix(`.${format}`, outFilename)
  if (outDir)
    outFilename = path.resolve(outDir, outFilename)
  return {
    output: outFilename,
    slides: options.data.slides,
    total: options.data.slides.length,
    range,
    format: format as 'pdf' | 'png' | 'md',
    template,
    base,
    timeout,
    wait,
    dark: dark ?? options.data.config.colorSchema === 'dark',
    routerMode: options.data.config.routerMode,
    withClicks,
    executablePath,
    withToc,
    perSlide,
    scale,
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
