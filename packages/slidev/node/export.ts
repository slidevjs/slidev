import path from 'path'
import fs from 'fs-extra'
import { PDFDocument } from 'pdf-lib'
import { blue, cyan, green, yellow } from 'kolorist'
import { Presets, SingleBar } from 'cli-progress'
import { parseRangeString } from '@slidev/parser/core'
import { packageExists } from './themes'

export interface ExportOptions {
  total: number
  range?: string
  port?: number
  base?: string
  format?: 'pdf' | 'png'
  output?: string
  timeout?: number
  dark?: boolean
  routerMode?: 'hash' | 'history'
  width?: number
  height?: number
  withClicks?: boolean
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
  dark = false,
  routerMode = 'history',
  width = 1920,
  height = 1080,
  withClicks = false,
}: ExportOptions) {
  if (!packageExists('playwright-chromium'))
    throw new Error('The exporting for Slidev is powered by Playwright, please installed it via `npm i playwright-chromium`')

  const { chromium } = await import('playwright-chromium')
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: {
      width,
      height,
    },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const progress = createSlidevProgress()

  async function go(no: number, clicks?: string) {
    progress.update(no)

    const path = `${no}?print${withClicks ? '=clicks' : ''}${clicks ? `&clicks=${clicks}` : ''}`
    const url = routerMode === 'hash'
      ? `http://localhost:${port}${base}#${path}`
      : `http://localhost:${port}${base}${path}`

    await page.goto(url, {
      waitUntil: 'networkidle',
    })
    await page.waitForTimeout(timeout)
    await page.waitForLoadState('networkidle')
    await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light', media: 'screen' })
  }

  function getClicks(url: string) {
    return url.match(/clicks=([1-9][0-9]*)/)?.[1]
  }

  async function genPageWithClicks(fn: (i: number, clicks?: string) => Promise<any>, i: number, clicks?: string) {
    await fn(i, clicks)
    if (withClicks) {
      await page.keyboard.press('ArrowRight', { delay: 100 })
      const _clicks = getClicks(page.url())
      if (_clicks && clicks !== _clicks)
        await genPageWithClicks(fn, i, _clicks)
    }
  }

  const pages = parseRangeString(total, range)

  progress.start(pages.length)

  if (format === 'pdf') {
    const buffers: Buffer[] = []
    const genPdfBuffer = async(i: number, clicks?: string) => {
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
    for (const i of pages)
      await genPageWithClicks(genPdfBuffer, i)

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
    const genScreenshot = async(i: number, clicks?: string) => {
      await go(i, clicks)
      await page.screenshot({
        omitBackground: false,
        path: path.join(output, `${i.toString().padStart(2, '0')}${clicks ? `-${clicks}` : ''}.png`),
      })
    }
    for (const i of pages)
      await genPageWithClicks(genScreenshot, i)
  }
  else {
    throw new Error(`Unsupported exporting format "${format}"`)
  }

  progress.stop()
  browser.close()
  return output
}
