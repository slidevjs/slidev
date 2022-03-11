import type { ComputedRef, Ref, WritableComputedRef } from 'vue'
import { computed, nextTick, reactive, ref } from 'vue'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import type { TocItem } from '../logic/nav'
import { addToTree, filterTree, getPath, getTreeWithActiveStatuses } from '../logic/nav'
import type { SlidevContextNav } from '../modules/context'
import { rawRoutes, router } from '../routes'

export function useNav(
  route: ComputedRef<RouteLocationNormalizedLoaded> | ComputedRef<RouteRecordRaw>,
  clicks: WritableComputedRef<number> | Ref<number> = ref(0),
): Omit<SlidevContextNav, 'downloadPDF' | 'next' | 'nextSlide' | 'openInEditor' | 'prev' | 'prevSlide'> {
  // force update collected elements when the route is fully resolved
  const routeForceRefresh = ref(0)
  nextTick(() => {
    router.afterEach(async() => {
      await nextTick()
      routeForceRefresh.value += 1
    })
  })

  const path = computed(() => route.value.path)
  const total = computed(() => rawRoutes.length - 1)

  const currentPage = computed(() => parseInt(path.value.split(/\//g).slice(-1)[0]) || 1)
  const currentPath = computed(() => getPath(currentPage.value))
  const currentRoute = computed(() => rawRoutes.find(i => i.path === `${currentPage.value}`))
  const currentSlideId = computed(() => currentRoute.value?.meta?.slide?.id)
  const currentLayout = computed(() => currentRoute.value?.meta?.layout)

  const nextRoute = computed(() => rawRoutes.find(i => i.path === `${Math.min(rawRoutes.length, currentPage.value + 1)}`))

  const clicksElements = computed<HTMLElement[]>(() => {
    // eslint-disable-next-line no-unused-expressions
    routeForceRefresh.value
    return currentRoute.value?.meta?.__clicksElements || []
  })

  const clicksTotal = computed(() => +(currentRoute.value?.meta?.clicks ?? clicksElements.value.length))

  const hasNext = computed(() => currentPage.value < rawRoutes.length - 1 || clicks.value < clicksTotal.value)
  const hasPrev = computed(() => currentPage.value > 1 || clicks.value > 0)

  const rawTree = computed(() => rawRoutes
    .filter((route: RouteRecordRaw) => route.meta?.slide?.title)
    .reduce((acc: TocItem[], route: RouteRecordRaw) => {
      addToTree(acc, route)
      return acc
    }, []))
  const treeWithActiveStatuses = computed(() => getTreeWithActiveStatuses(rawTree.value, currentRoute.value))
  const tree = computed(() => filterTree(treeWithActiveStatuses.value))

  return reactive({
    route,
    clicks,
    path,
    total,
    currentPage,
    currentPath,
    currentRoute,
    currentSlideId,
    currentLayout,
    nextRoute,
    clicksElements,
    clicksTotal,
    hasNext,
    hasPrev,
    rawTree,
    treeWithActiveStatuses,
    tree,
  })
}
