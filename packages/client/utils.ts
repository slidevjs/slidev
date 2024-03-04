import type { SlideRoute } from '@slidev/types'
import { configs } from './env'

export function getSlideClass(route?: SlideRoute, extra = '') {
  const classes = ['slidev-page', extra]

  const no = route?.meta?.slide?.no
  if (no != null)
    classes.push(`slidev-page-${no}`)

  return classes.filter(Boolean).join(' ')
}

export async function downloadPDF() {
  const { saveAs } = await import('file-saver')
  saveAs(
    typeof configs.download === 'string'
      ? configs.download
      : configs.exportFilename
        ? `${configs.exportFilename}.pdf`
        : `${import.meta.env.BASE_URL}slidev-exported.pdf`,
    `${configs.title}.pdf`,
  )
}
