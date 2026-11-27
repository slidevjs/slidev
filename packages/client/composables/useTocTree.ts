import type { SlideRoute, TocItem } from '@slidev/types'
import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'
import { getSlidePath } from '../logic/slides'

function addToTree(tree: TocItem[], route: SlideRoute, level = 1) {
  const titleLevel = route.meta.slide.level ?? level
  if (titleLevel && titleLevel > level && tree.length > 0) {
    addToTree(tree[tree.length - 1].children, route, level + 1)
  }
  else {
    tree.push({
      no: route.no,
      children: [],
      level,
      titleLevel,
      path: getSlidePath(route.meta.slide?.frontmatter?.routeAlias ?? route.no, false),
      hideInToc: Boolean(route.meta?.slide?.frontmatter?.hideInToc),
      title: route.meta?.slide?.title,
    })
  }
}

function getTreeWithActiveStatuses(
  tree: TocItem[],
  currentRoute?: SlideRoute,
  hasActiveParent = false,
  parent?: TocItem,
  currentSlideNo?: Ref<number>,
): TocItem[] {
  return tree.map((item: TocItem) => {
    const clone = {
      ...item,
      active: item.no === currentSlideNo?.value,
      hasActiveParent,
    }
    if (clone.children.length > 0) {
      clone.children = getTreeWithActiveStatuses(
        clone.children,
        currentRoute,
        clone.active || clone.hasActiveParent,
        clone,
        currentSlideNo,
      )
    }
    if (parent && (clone.active || clone.activeParent))
      parent.activeParent = true
    return clone
  })
}

function filterTree(tree: TocItem[], level = 1): TocItem[] {
  return tree
    .filter((item: TocItem) => !item.hideInToc)
    .map((item: TocItem) => ({
      ...item,
      children: filterTree(item.children, level + 1),
    }))
}

export function useTocTree(
  slides: Ref<SlideRoute[]>,
  currentSlideNo: Ref<number>,
  currentSlideRoute: Ref<SlideRoute>,
): ComputedRef<TocItem[]> {
  const rawTree = computed(() => slides.value
    .filter((route: SlideRoute) => route.meta?.slide?.title)
    .reduce((acc: TocItem[], route: SlideRoute) => {
      addToTree(acc, route)
      return acc
    }, []))

  const treeWithActiveStatuses = computed(() => getTreeWithActiveStatuses(
    rawTree.value,
    currentSlideRoute.value,
    undefined,
    undefined,
    currentSlideNo,
  ))

  return computed(() => filterTree(treeWithActiveStatuses.value))
}
