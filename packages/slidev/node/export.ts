import path from 'path'
import fs from 'fs-extra'
import { chromium } from 'playwright'
import { PDFDocument } from 'pdf-lib'
import { yellow } from 'kolorist'

export interface ExportOptions {
  pages: number
  port?: number
  format?: 'pdf' | 'png'
  output?: string
  timeout?: number
}

export async function exportSlides({
  port = 18724,
  pages = 0,
  format = 'pdf',
  output = 'slides',
  timeout = 100,
}: ExportOptions) {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: {
      width: 1920,
      height: 1080,
    },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  async function go(no: number) {
    console.log(`${yellow('Rendering')} page ${no + 1} / ${pages} ...`)
    await page.goto(`http://localhost:${port}/${no}?print`, {
      waitUntil: 'networkidle',
    })
    await page.waitForTimeout(timeout)
    await page.waitForLoadState('networkidle')
    await page.emulateMedia({ media: 'screen' })
  }

  if (format === 'pdf') {
    const buffers: Buffer[] = []
    for (let i = 0; i < pages; i++) {
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
    for (let i = 0; i < pages; i++) {
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

  browser.close()
  return output
}
