import { promises as fs } from 'fs'
import { chromium } from 'playwright'
import { InlineConfig } from 'vite'
import { PDFDocument } from 'pdf-lib'
import { green } from 'chalk'
import { createServer } from './server'
import { parseSlidesMarkdown } from './parser'

export async function genratePDF(entry = 'slides.md', config: InlineConfig = {}) {
  const pages = parseSlidesMarkdown(await fs.readFile(entry, 'utf-8'))
  const server = await createServer(entry, {
    ...config,
    logLevel: 'silent',
    clearScreen: false,
  })
  const port = 18724
  await server.listen(port)

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: {
      width: 1920,
      height: 1080,
    },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  const buffers: Buffer[] = []
  const pagesCount = pages.length - 1
  for (let i = 0; i < pagesCount; i++) {
    console.log(`Exporting: ${i + 1} / ${pagesCount}`)
    await page.goto(`http://localhost:${port}/${i}?print`, {
      waitUntil: 'networkidle',
    })
    await page.emulateMedia({ media: 'screen' })
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
  await fs.writeFile('slides.pdf', buffer)
  console.log(green`Exporting finished: ./slides.pdf`)

  browser.close()
  server.close()
  process.exit(0)
}
