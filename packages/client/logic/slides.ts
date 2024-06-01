import type { SlideRoute } from '@slidev/types'
import { slides } from '#slidev/slides'

export { slides }

export function getSlide(no: number | string) {
  return slides.value.find(
    s => (s.no === +no || s.meta.slide?.frontmatter.routeAlias === no),
  )
}

export function getSlidePath(
  route: SlideRoute | number | string,
  presenter: boolean,
) {
  if (typeof route === 'number' || typeof route === 'string')
    route = getSlide(route)!
  const no = route.meta.slide?.frontmatter.routeAlias ?? route.no
  return presenter ? `/presenter/${no}` : `/${no}`
}
