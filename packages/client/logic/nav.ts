import { computed, Ref, ref } from 'vue'
import { isString, SwipeDirection, timestamp, useSwipe } from '@vueuse/core'
import { query } from '../state'
import { rawRoutes, router } from '../routes'
import { configs } from '../env'

export { rawRoutes }

export const route = computed(() => router.currentRoute.value)

export const isPresenter = computed(() => route.value.path.startsWith('/presenter'))

export const total = computed(() => rawRoutes.length)
export const path = computed(() => route.value.path)

export const currentPage = computed(() => parseInt(path.value.split(/\//g).slice(-1)[0]) || 0)
export const currentPath = computed(() => getPath(currentPage.value))
export const currentRoute = computed(() => rawRoutes.find(i => i.path === `${currentPage.value}`))
export const currentSlideId = computed(() => currentRoute.value?.meta?.slide?.id)

export const hasNext = computed(() => currentPage.value < rawRoutes.length - 1)
export const hasPrev = computed(() => currentPage.value > 0)
export const nextRoute = computed(() => rawRoutes.find(i => i.path === `${Math.min(rawRoutes.length - 1, currentPage.value + 1)}`))

export const tabElements = ref<HTMLElement[]>([])
export const tab = computed<number>({
  get() {
    let tab = +query.tab || 0
    if (isNaN(tab))
      tab = 0
    return tab
  },
  set(v) {
    query.tab = v.toString()
  },
})

export function next() {
  if (tabElements.value.length <= tab.value)
    nextSlide()
  else
    tab.value += 1
}

export async function prev() {
  if (tab.value <= 0)
    prevSlide()
  else
    tab.value -= 1
}

export function getPath(no: number | string) {
  return isPresenter.value ? `/presenter/${no}` : `/${no}`
}

export function nextSlide() {
  const next = Math.min(rawRoutes.length - 1, currentPage.value + 1)
  return go(next)
}

export function prevSlide() {
  const next = Math.max(0, currentPage.value - 1)
  return go(next)
}

export function go(page: number) {
  tab.value = 0
  return router.push(getPath(page))
}

export function useSwipeControls(root: Ref<HTMLElement | undefined>) {
  const swipeBegin = ref(0)
  const { direction, lengthX, lengthY } = useSwipe(root, {
    onSwipeStart() {
      swipeBegin.value = timestamp()
    },
    onSwipeEnd() {
      if (!swipeBegin.value)
        return
      const x = Math.abs(lengthX.value)
      const y = Math.abs(lengthY.value)
      if (x / window.innerWidth > 0.3 || x > 100) {
        if (direction.value === SwipeDirection.LEFT)
          next()
        else
          prev()
      }
      else if (y / window.innerHeight > 0.4 || y > 200) {
        if (direction.value === SwipeDirection.DOWN)
          prevSlide()
        else
          nextSlide()
      }
    },
  })
}

export async function downloadPDF() {
  const { saveAs } = await import('file-saver')
  saveAs(
    isString(configs.download)
      ? configs.download
      : `${import.meta.env.BASE_URL}slidev-exported.pdf`,
    `${configs.title}.pdf`,
  )
}
