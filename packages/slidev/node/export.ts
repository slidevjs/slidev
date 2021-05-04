import path from 'path'
import fs from 'fs-extra'
import { PDFDocument } from 'pdf-lib'
import { blue, cyan, green, yellow } from 'kolorist'
import { Presets, SingleBar } from 'cli-progress'
import { getPagesByRange } from './utils'
import { packageExists } from './themes'

export interface ExportOptions {
  total: number
  range?: string
  port?: number
  base?: string
  format?: 'pdf' | 'png'
  output?: string
  timeout?: number
}

function createSlidevProgress() {
  function getSpinner(n = 0) {
    return [cyan('●'), green('◆'), blue('■'), yellow('▲')][n % 4]
  }
  let current = 0
  let spinner = 0
  let timer: any

  const progress = new SingleBar({
    clearOnComplete: true,
    hideCursor: true,
    format: `  {spin} ${yellow('rendering')} {bar} {value}/{total}`,
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
  port = 18724,
  total = 0,
  range,
  format = 'pdf',
  output = 'slides',
  base = '/',
  timeout = 500,
}: ExportOptions) {
  if (!packageExists('playwright-chromium'))
    throw new Error('The exporting for Slidev is powered by Playwright, please installed it via `npm i playwright-chromium`')

  const { chromium } = await import('playwright-chromium')
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: {
      width: 1920,
      height: 1080,
    },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const progress = createSlidevProgress()

  async function go(no: number) {
    progress.update(no + 1)
    await page.goto(`http://localhost:${port}${base}${no}?print`, {
      waitUntil: 'networkidle',
    })
    await page.waitForTimeout(timeout)
    await page.waitForLoadState('networkidle')
    await page.emulateMedia({ media: 'screen' })
  }

  const pages = getPagesByRange(total, range)

  progress.start(pages.length)

  if (format === 'pdf') {
    const buffers: Buffer[] = []
    for (const i of pages) {
      await go(i)
      const pdf = await page.pdf({
        width: 1920,
        height: 1080,
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

    const mergedPdf = await PDFDocument.create({})
    for (const pdfBytes of buffers) {
      const pdf = await PDFDocument.load(pdfBytes)
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page)
      })
    }

    const buffer = await mergedPdf.save()
    if (!output.endsWith('.pdf'))
      output = `${output}.pdf`
    await fs.writeFile(output, buffer)
  }
  else if (format === 'png') {
    await fs.emptyDir(output)
    for (const i of pages) {
      await go(i)
      await page.screenshot({
        omitBackground: false,
        path: path.join(output, `${(i + 1).toString().padStart(2, '0')}.png`),
      })
    }
  }
  else {
    throw new Error(`Unsupported exporting format "${format}"`)
  }

  progress.stop()
  browser.close()
  return output
}
