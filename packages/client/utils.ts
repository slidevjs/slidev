import type { SlideRoute } from '@slidev/types'

export function getSlideClass(route?: SlideRoute, extra = '') {
  const classes = ['slidev-page', extra]

  const no = route?.meta?.slide?.no
  if (no != null)
    classes.push(`slidev-page-${no}`)

  return classes.filter(Boolean).join(' ')
}
