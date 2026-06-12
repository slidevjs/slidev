import type { SlideRoute } from '@slidev/types'

export function getSlideRoutePath(
  route: SlideRoute,
  presenter: boolean,
  exporting: boolean = false,
) {
  const no = route.meta.slide?.frontmatter.routeAlias ?? route.no
  return exporting ? `/export/${no}` : presenter ? `/presenter/${no}` : `/${no}`
}
