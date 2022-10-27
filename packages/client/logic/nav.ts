import type { Ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { computed, nextTick, ref } from 'vue'
import { SwipeDirection, isString, timestamp, usePointerSwipe } from '@vueuse/core'
import { rawRoutes, router } from '../routes'
import { configs } from '../env'
import { useRouteQuery } from './route'
import { isDrawing } from './drawings'

export interface TocItem {
  active?: boolean
  activeParent?: boolean
  children: TocItem[]
  hasActiveParent?: boolean
  level: number
  path: string
  hideInToc?: boolean
  title?: string
}

export { rawRoutes, router }

// force update collected elements when the route is fully resolved
const routeForceRefresh = ref(0)
nextTick(() => {
  router.afterEach(async () => {
    await nextTick()
    routeForceRefresh.value += 1
  })
})

export const route = computed(() => router.currentRoute.value)

export const isPrintMode = computed(() => route.value.query.print !== undefined)
export const isPrintWithClicks = computed(() => route.value.query.print === 'clicks')
export const isEmbedded = computed(() => route.value.query.embedded !== undefined)
export const isPresenter = computed(() => route.value.path.startsWith('/presenter'))
export const isClicksDisabled = computed(() => isPrintMode.value && !isPrintWithClicks.value)
export const presenterPassword = computed(() => route.value.query.password)
export const showPresenter = computed(() => !isPresenter.value && (!configs.remote || presenterPassword.value === configs.remote))

export const queryClicks = useRouteQuery('clicks', '0')
export const total = computed(() => rawRoutes.length - 1)
export const path = computed(() => route.value.path)

export const currentPage = computed(() => parseInt(path.value.split(/\//g).slice(-1)[0]) || 1)
export const currentPath = computed(() => getPath(currentPage.value))
export const currentRoute = computed(() => rawRoutes.find(i => i.path === `${currentPage.value}`))
export const currentSlideId = computed(() => currentRoute.value?.meta?.slide?.id)
export const currentLayout = computed(() => currentRoute.value?.meta?.layout || (currentPage.value === 1 ? 'cover' : 'default'))

export const nextRoute = computed(() => rawRoutes.find(i => i.path === `${Math.min(rawRoutes.length, currentPage.value + 1)}`))

export const clicksElements = computed<HTMLElement[]>(() => {
  // eslint-disable-next-line no-unused-expressions
  routeForceRefresh.value
  return currentRoute.value?.meta?.__clicksElements || []
})

export const clicks = computed<number>({
  get() {
    if (isClicksDisabled.value)
      return 99999
    let clicks = +(queryClicks.value || 0)
    if (isNaN(clicks))
      clicks = 0
    return clicks
  },
  set(v) {
    queryClicks.value = v.toString()
  },
})

export const clicksTotal = computed(() => +(currentRoute.value?.meta?.clicks ?? clicksElements.value.length))

export const hasNext = computed(() => currentPage.value < rawRoutes.length - 1 || clicks.value < clicksTotal.value)
export const hasPrev = computed(() => currentPage.value > 1 || clicks.value > 0)

export const rawTree = computed(() => rawRoutes
  .filter((route: RouteRecordRaw) => route.meta?.slide?.title)
  .reduce((acc: TocItem[], route: RouteRecordRaw) => {
    addToTree(acc, route)
    return acc
  }, []))
export const treeWithActiveStatuses = computed(() => getTreeWithActiveStatuses(rawTree.value, currentRoute.value))
export const tree = computed(() => filterTree(treeWithActiveStatuses.value))

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
  if (lastClicks && clicksTotal.value)
    router.replace({ query: { ...route.value.query, clicks: clicksTotal.value } })
}

export function goFirst() {
  return go(1)
}

export function goLast() {
  return go(total.value)
}

export function go(page: number | string, clicks?: number) {
  return router.push({ path: getPath(page), query: { ...route.value.query, clicks } })
}

export function useSwipeControls(root: Ref<HTMLElement | undefined>) {
  const swipeBegin = ref(0)
  const { direction, distanceX, distanceY } = usePointerSwipe(root, {
    onSwipeStart(e) {
      if (e.pointerType !== 'touch')
        return
      if (isDrawing.value)
        return
      swipeBegin.value = timestamp()
    },
    onSwipeEnd(e) {
      if (e.pointerType !== 'touch')
        return
      if (!swipeBegin.value)
        return
      if (isDrawing.value)
        return

      const x = Math.abs(distanceX.value)
      const y = Math.abs(distanceY.value)
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
      : configs.exportFilename
        ? `${configs.exportFilename}.pdf`
        : `${import.meta.env.BASE_URL}slidev-exported.pdf`,
    `${configs.title}.pdf`,
  )
}

export async function openInEditor(url?: string) {
  if (url == null) {
    const slide = currentRoute.value?.meta?.slide
    if (!slide?.filepath)
      return false
    url = `${slide.filepath}:${slide.start}`
  }
  await fetch(`/__open-in-editor?file=${encodeURIComponent(url)}`)
  return true
}

export function addToTree(tree: TocItem[], route: RouteRecordRaw, level = 1) {
  const titleLevel = route.meta?.slide?.level
  if (titleLevel && titleLevel > level && tree.length > 0) {
    addToTree(tree[tree.length - 1].children, route, level + 1)
  }
  else {
    tree.push({
      children: [],
      level,
      path: route.path,
      hideInToc: Boolean(route.meta?.hideInToc),
      title: route.meta?.slide?.title,
    })
  }
}

export function getTreeWithActiveStatuses(
  tree: TocItem[],
  currentRoute?: RouteRecordRaw,
  hasActiveParent = false,
  parent?: TocItem,
): TocItem[] {
  return tree.map((item: TocItem) => {
    const clone = {
      ...item,
      active: item.path === currentRoute?.path,
      hasActiveParent,
    }
    if (clone.children.length > 0)
      clone.children = getTreeWithActiveStatuses(clone.children, currentRoute, clone.active || clone.hasActiveParent, clone)
    if (parent && (clone.active || clone.activeParent))
      parent.activeParent = true
    return clone
  })
}

export function filterTree(tree: TocItem[], level = 1): TocItem[] {
  return tree
    .filter((item: TocItem) => !item.hideInToc)
    .map((item: TocItem) => ({
      ...item,
      children: filterTree(item.children, level + 1),
    }))
}
