import { promises as fs } from 'fs'
import { chromium } from 'playwright'
import { PDFDocument } from 'pdf-lib'
import { yellow } from 'kolorist'

export async function genratePDF(port = 18724, pages = 0, output = 'slides.pdf') {
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
  for (let i = 0; i < pages; i++) {
    console.log(`${yellow('Rendering')} page ${i + 1} / ${pages}`)
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
  await fs.writeFile(output, buffer)
  browser.close()
  return output
}
