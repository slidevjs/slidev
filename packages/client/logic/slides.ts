import type { SlideRoute } from '@slidev/types'
import { slides } from '#slidev/slides'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
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
  // Use `$nav.value.currentSlideNo` rather than `useNav().currentSlideNo` to make it work in print/export mode. See https://github.com/slidevjs/slidev/issues/2310.
  return computed(() => $page.value === $nav.value.currentSlideNo)
}

export function useIsMounted() {
  const ismounted = ref<boolean>(false)
  onMounted(() => {
    ismounted.value = true
  })
  onUnmounted(() => {
    ismounted.value = false
  })
  return ismounted
}

export function onSlideEnter(cb: (to: number, from: number | undefined) => any) {
  const ismounted = useIsMounted()
  const { $page, $nav } = useSlideContext()

  // Note: using watch + immediate rather than watchEffect since the latter could have
  //   unexpected reloads triggered by references used in `cb`
  // Note: using `ismounted` to make sure `onSliderEnter` is only called after `onMounted`
  watch(() => [$nav.value.currentSlideNo, ismounted.value], ([to, mounted], from) =>
    $page.value === to && mounted && cb(to, from ? from[0] as number : undefined), { immediate: true, flush: 'post' })
}

export function onSlideLeave(cb: (to: number, from: number | undefined) => any) {
  const { $page, $nav } = useSlideContext()
  watch(() => $nav.value.currentSlideNo, (to, from) =>
    $page.value === from && cb(to, from))
}
