import type { SlideRoute } from '@slidev/types'
import { router } from '../routes'
import { isPresenter } from './nav-state'
import { slides } from '#slidev/slides'

export { slides, router }

export function getSlide(no: number | string) {
  return slides.value.find(
    s => (s.no === +no || s.meta.slide?.frontmatter.routeAlias === no),
  )
}

export function getSlidePath(route: SlideRoute | number | string, presenter = isPresenter.value) {
  if (typeof route === 'number' || typeof route === 'string')
    route = getSlide(route)!
  const no = route.meta.slide?.frontmatter.routeAlias ?? route.no
  return presenter ? `/presenter/${no}` : `/${no}`
}
