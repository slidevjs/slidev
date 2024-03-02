import type { ClicksContext, SlideRoute } from '@slidev/types'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { downloadPDF, getSlidePath, openInEditor, rawTree, slides, total, tree, treeWithActiveStatuses } from '../logic/nav'
import type { SlidevContextNav } from '../modules/context'

export function useNavBase(currentSlideRoute: ComputedRef<SlideRoute>, clicksContext: ComputedRef<ClicksContext>): SlidevContextNav {
  const path = computed(() => getSlidePath(currentSlideRoute.value))
  const currentSlideNo = computed(() => currentSlideRoute.value.no)
  const currentLayout = computed(() => currentSlideRoute.value.meta?.layout || (currentSlideNo.value === 1 ? 'cover' : 'default'))
  const clicks = computed(() => clicksContext.value.current)
  const clicksTotal = computed(() => clicksContext.value.total)
  const nextRoute = computed(() => slides.value[Math.min(slides.value.length, currentSlideNo.value + 1) - 1])
  const prevRoute = computed(() => slides.value[Math.max(1, currentSlideNo.value - 1) - 1])
  const hasNext = computed(() => currentSlideNo.value < slides.value.length || clicks.value < clicksTotal.value)
  const hasPrev = computed(() => currentSlideNo.value > 1 || clicks.value > 0)

  const noOp = async () => { }

  return {
    slides,
    total,
    path,
    currentSlideNo,
    currentSlideRoute,
    currentLayout,
    nextRoute,
    prevRoute,
    clicksContext,
    clicks,
    clicksTotal,
    hasNext,
    hasPrev,
    rawTree,
    treeWithActiveStatuses,
    tree,
    next: noOp,
    prev: noOp,
    nextSlide: noOp,
    prevSlide: noOp,
    goFirst: noOp,
    goLast: noOp,
    go: noOp,
    downloadPDF,
    openInEditor,
  }
}

export function useFixedNav(currentSlideRoute: SlideRoute, clicksContext: ClicksContext): SlidevContextNav {
  return useNavBase(computed(() => currentSlideRoute), computed(() => clicksContext))
}
