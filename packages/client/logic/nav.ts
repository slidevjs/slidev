import { computed, Ref, ref } from 'vue'
import { isString, SwipeDirection, timestamp, useSwipe } from '@vueuse/core'
import { query } from '../state'
import { rawRoutes, router } from '../routes'
import { configs } from '../env'

export { rawRoutes }

export const route = computed(() => router.currentRoute.value)

export const isPresenter = computed(() => route.value.path.startsWith('/presenter'))

export const total = computed(() => rawRoutes.length - 1)
export const path = computed(() => route.value.path)

export const currentPage = computed(() => parseInt(path.value.split(/\//g).slice(-1)[0]) || 1)
export const currentPath = computed(() => getPath(currentPage.value))
export const currentRoute = computed(() => rawRoutes.find(i => i.path === `${currentPage.value}`))
export const currentSlideId = computed(() => currentRoute.value?.meta?.slide?.id)

export const hasNext = computed(() => currentPage.value < rawRoutes.length - 1)
export const hasPrev = computed(() => currentPage.value > 1)
export const nextRoute = computed(() => rawRoutes.find(i => i.path === `${Math.min(rawRoutes.length, currentPage.value + 1)}`))

export const clicksElements = ref<HTMLElement[]>([])
export const clicks = computed<number>({
  get() {
    let clicks = +query.clicks || 0
    if (isNaN(clicks))
      clicks = 0
    return clicks
  },
  set(v) {
    query.clicks = v.toString()
  },
})

export const clicksTotal = computed(() => +(currentRoute.value?.meta?.clicks ?? clicksElements.value.length))

export function next() {
  if (clicksTotal.value <= clicks.value)
    nextSlide()
  else
    clicks.value += 1
}

export async function prev() {
  if (clicks.value <= 0)
    await prevSlide()

  else
    clicks.value -= 1
}

export function getPath(no: number | string) {
  return isPresenter.value ? `/presenter/${no}` : `/${no}`
}

export function nextSlide() {
  const next = Math.min(rawRoutes.length, currentPage.value + 1)
  return go(next)
}

export async function prevSlide(lastClicks = true) {
  const next = Math.max(1, currentPage.value - 1)
  await go(next)
  if (lastClicks)
    clicks.value = clicksTotal.value
}

export function go(page: number) {
  clicks.value = 0
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
