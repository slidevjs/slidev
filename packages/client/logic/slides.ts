import type { SlideRoute } from '@slidev/types'
import { slides } from '#slidev/slides'
import { tryOnMounted } from '@vueuse/core'
import { computed, watch } from 'vue'
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

export function onSlideEnter(cb: (to: number, from: number | undefined) => any) {
  const { $page, $nav } = useSlideContext()

  tryOnMounted(() => {
    watch(() => $nav.value.currentSlideNo, (to, from) => {
      if ($page.value === to)
        cb(to, from)
    }, { immediate: true })
  })
}

export function onSlideLeave(cb: (to: number, from: number | undefined) => any) {
  const { $page, $nav } = useSlideContext()

  tryOnMounted(() => {
    watch(() => $nav.value.currentSlideNo, (to, from) => {
      if ($page.value === from)
        cb(to, from)
    })
  })
}
