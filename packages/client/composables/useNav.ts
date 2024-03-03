import type { ClicksContext, SlideRoute } from '@slidev/types'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { configs } from '../env'
import type { SlidevContextNav } from '../modules/context'
import { getSlidePath, rawTree, tree, treeWithActiveStatuses } from '../logic/nav'
import { slides } from '#slidev/slides'

export function useNavBase(currentSlideRoute: ComputedRef<SlideRoute>, clicksContext: ComputedRef<ClicksContext>) {
  const total = computed(() => slides.value.length)
  const path = computed(() => getSlidePath(currentSlideRoute.value))
  const currentSlideNo = computed(() => currentSlideRoute.value.no)
  const currentLayout = computed(() => currentSlideRoute.value.meta?.layout || (currentSlideNo.value === 1 ? 'cover' : 'default'))
  const clicks = computed(() => clicksContext.value.current)
  const clicksTotal = computed(() => clicksContext.value.total)
  const nextRoute = computed(() => slides.value[Math.min(slides.value.length, currentSlideNo.value + 1) - 1])
  const prevRoute = computed(() => slides.value[Math.max(1, currentSlideNo.value - 1) - 1])
  const hasNext = computed(() => currentSlideNo.value < slides.value.length || clicks.value < clicksTotal.value)
  const hasPrev = computed(() => currentSlideNo.value > 1 || clicks.value > 0)

  async function downloadPDF() {
    const { saveAs } = await import('file-saver')
    saveAs(
      typeof configs.download === 'string'
        ? configs.download
        : configs.exportFilename
          ? `${configs.exportFilename}.pdf`
          : `${import.meta.env.BASE_URL}slidev-exported.pdf`,
      `${configs.title}.pdf`,
    )
  }

  async function openInEditor(url?: string) {
    if (url == null) {
      const slide = currentSlideRoute.value?.meta?.slide
      if (!slide)
        return false
      url = `${slide.filepath}:${slide.start}`
    }
    await fetch(`/__open-in-editor?file=${encodeURIComponent(url)}`)
    return true
  }

  return {
    slides,
    total,
    path,
    currentSlideNo,
    currentPage: currentSlideNo,
    currentSlideRoute,
    currentLayout,
    nextRoute,
    prevRoute,
    clicksContext,
    clicks,
    clicksTotal,
    hasNext,
    hasPrev,
    downloadPDF,
    openInEditor,
  }
}

export function useFixedNav(currentSlideRoute: SlideRoute, clicksContext: ClicksContext): SlidevContextNav {
  const noOp = async () => { }
  return {
    ...useNavBase(computed(() => currentSlideRoute), computed(() => clicksContext)),
    next: noOp,
    prev: noOp,
    nextSlide: noOp,
    prevSlide: noOp,
    goFirst: noOp,
    goLast: noOp,
    go: noOp,
    rawTree,
    treeWithActiveStatuses,
    tree,
  }
}
