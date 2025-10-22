import type { SlideRoute } from '@slidev/types'
import { slides } from '#slidev/slides'
import { computed, watch, watchEffect } from 'vue'
import { useSlideContext } from '../context'

export { slides }

export function getSlide(no: number | string) {
  return slides.value.find(
    s => (s.no === +no || s.meta.slide?.frontmatter.routeAlias === no),
  )
}

export function getSlidePath(
  route: SlideRoute | number | string,
  presenter: boolean,
  exporting: boolean = false,
) {
  if (typeof route === 'number' || typeof route === 'string')
    route = getSlide(route)!
  const no = route.meta.slide?.frontmatter.routeAlias ?? route.no
  return exporting ? `/export/${no}` : presenter ? `/presenter/${no}` : `/${no}`
}

export function useIsSlideActive() {
  const { $page, $nav } = useSlideContext()
  return computed(() => $page.value === $nav.value.currentSlideNo) // Use `$nav.value.currentSlideNo` rather than `useNav().currentSlideNo` to make it work in print/export mode. See https://github.com/slidevjs/slidev/issues/2310.
}

export function onSlideEnter(cb: () => void) {
  const isActive = useIsSlideActive()
  watchEffect(() => isActive.value && cb())
}

export function onSlideLeave(cb: () => void) {
  const isActive = useIsSlideActive()
  watch(isActive, () => !isActive.value && cb())
}
