import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import type { TocItem } from '@slidev/types'
import type { SlidevContextNav } from '../modules/context'
import { addToTree, downloadPDF, filterTree, getPath, getTreeWithActiveStatuses, next, nextSlide, openInEditor, prev, prevSlide } from '../logic/nav'
import { rawRoutes } from '../routes'

export function useNav(route: ComputedRef<RouteRecordRaw | RouteLocationNormalizedLoaded>): SlidevContextNav {
  const path = computed(() => route.value.path)
  const total = computed(() => rawRoutes.length)

  const currentPage = computed(() => Number.parseInt(path.value.split(/\//g).slice(-1)[0]) || 1)
  const currentPath = computed(() => getPath(currentPage.value))
  const currentRoute = computed(() => rawRoutes.find(i => i.path === `${currentPage.value}`))
  const currentSlideId = computed(() => currentRoute.value?.meta?.slide?.id)
  const currentLayout = computed(() => currentRoute.value?.meta?.layout || (currentPage.value === 1 ? 'cover' : 'default'))

  const nextRoute = computed(() => rawRoutes.find(i => i.path === `${Math.min(rawRoutes.length, currentPage.value + 1)}`))

  const rawTree = computed(() => rawRoutes
    .filter((route: RouteRecordRaw) => route.meta?.slide?.title)
    .reduce((acc: TocItem[], route: RouteRecordRaw) => {
      addToTree(acc, route)
      return acc
    }, []))
  const treeWithActiveStatuses = computed(() => getTreeWithActiveStatuses(rawTree.value, currentRoute.value))
  const tree = computed(() => filterTree(treeWithActiveStatuses.value))

  return {
    route,
    path,
    total,
    currentPage,
    currentPath,
    currentRoute,
    currentSlideId,
    currentLayout,
    nextRoute,
    rawTree,
    treeWithActiveStatuses,
    tree,
    downloadPDF,
    next,
    nextSlide,
    openInEditor,
    prev,
    prevSlide,
  }
}
