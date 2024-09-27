import type { SlideRoute } from '@slidev/types'
import { slides } from '#slidev/slides'
import { computed, watch, watchEffect } from 'vue'
import { useNav } from '../composables/useNav'
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
) {
  if (typeof route === 'number' || typeof route === 'string')
    route = getSlide(route)!
  const no = route.meta.slide?.frontmatter.routeAlias ?? route.no
  return presenter ? `/presenter/${no}` : `/${no}`
}

export function useIsSlideActive() {
  const { $page } = useSlideContext()
  const { currentSlideNo } = useNav()
  return computed(() => $page.value === currentSlideNo.value)
}

export function onSlideEnter(cb: () => void) {
  const isActive = useIsSlideActive()
  watchEffect(() => isActive.value && cb())
}

export function onSlideLeave(cb: () => void) {
  const isActive = useIsSlideActive()
  watch(isActive, () => !isActive.value && cb())
}
