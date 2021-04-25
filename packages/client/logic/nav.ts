import { computed, ref } from 'vue'
import { and, not, whenever } from '@vueuse/core'
import { isInputing, magicKeys, query } from '../state'
import { rawRoutes, router } from '../routes'

export { rawRoutes }

export const route = computed(() => router.currentRoute.value)
export const paused = ref(false)

export const isPresenter = computed(() => route.value.path.startsWith('/presenter'))

export const total = computed(() => rawRoutes.length)
export const path = computed(() => route.value.path)
export const currentPage = computed(() => parseInt(path.value.split(/\//g).slice(-1)[0]) || 0)
export const currentPath = computed(() => getPath(currentPage.value))
export const currentRoute = computed(() => rawRoutes.find(i => i.path === `${currentPage.value}`))
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

const shortcutEnabled = and(not(paused), not(isInputing))

whenever(and(magicKeys.space, shortcutEnabled), next)
whenever(and(magicKeys.right, shortcutEnabled), next)
whenever(and(magicKeys.left, shortcutEnabled), prev)
whenever(and(magicKeys.up, shortcutEnabled), prevSlide)
whenever(and(magicKeys.down, shortcutEnabled), nextSlide)
