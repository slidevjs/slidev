import type { ClicksContext, SlideRoute, TocItem } from '@slidev/types'
import type { ComputedRef, Ref, TransitionGroupProps } from 'vue'
import { computed, ref, watch } from 'vue'
import type { Router } from 'vue-router'
import { getCurrentTransition } from '../logic/transition'
import { getSlidePath } from '../logic/slides'
import { useTocTree } from './useTocTree'
import { skipTransition } from './hmr'
import { slides } from '#slidev/slides'

export interface SlidevContextNav {
  slides: Ref<SlideRoute[]>
  total: ComputedRef<number>

  currentPath: ComputedRef<string>
  currentPage: ComputedRef<number>
  currentSlideNo: ComputedRef<number>
  currentSlideRoute: ComputedRef<SlideRoute>
  currentTransition: ComputedRef<TransitionGroupProps | undefined>
  currentLayout: ComputedRef<string>

  nextRoute: ComputedRef<SlideRoute>
  prevRoute: ComputedRef<SlideRoute>
  hasNext: ComputedRef<boolean>
  hasPrev: ComputedRef<boolean>

  clicksContext: ComputedRef<ClicksContext>
  clicks: ComputedRef<number>
  clicksTotal: ComputedRef<number>

  /** The table of content tree */
  tocTree: ComputedRef<TocItem[]>
  /** The direction of the navigation, 1 for forward, -1 for backward */
  navDirection: Ref<number>
  /** The direction of the clicks, 1 for forward, -1 for backward */
  clicksDirection: Ref<number>
  /** Utility function for open file in editor, only avaible in dev mode  */
  openInEditor: (url?: string) => Promise<boolean>

  /** Go to next click */
  next: () => Promise<void>
  /** Go to previous click */
  prev: () => Promise<void>
  /** Go to next slide */
  nextSlide: () => Promise<void>
  /** Go to previous slide */
  prevSlide: (lastClicks?: boolean) => Promise<void>
  /** Go to slide */
  go: (page: number | string, clicks?: number) => Promise<void>
  /** Go to the first slide */
  goFirst: () => Promise<void>
  /** Go to the last slide */
  goLast: () => Promise<void>
}

export function useNavBase(
  currentSlideRoute: ComputedRef<SlideRoute>,
  clicksContext: ComputedRef<ClicksContext>,
  queryClicks: Ref<number> = ref(0),
  router?: Router,
): SlidevContextNav {
  const total = computed(() => slides.value.length)

  const navDirection = ref(0)
  const clicksDirection = ref(0)

  const currentPath = computed(() => getSlidePath(currentSlideRoute.value))
  const currentSlideNo = computed(() => currentSlideRoute.value.no)
  const currentLayout = computed(() => currentSlideRoute.value.meta?.layout || (currentSlideNo.value === 1 ? 'cover' : 'default'))

  const clicks = computed(() => clicksContext.value.current)
  const clicksTotal = computed(() => clicksContext.value.total)
  const nextRoute = computed(() => slides.value[Math.min(slides.value.length, currentSlideNo.value + 1) - 1])
  const prevRoute = computed(() => slides.value[Math.max(1, currentSlideNo.value - 1) - 1])
  const hasNext = computed(() => currentSlideNo.value < slides.value.length || clicks.value < clicksTotal.value)
  const hasPrev = computed(() => currentSlideNo.value > 1 || clicks.value > 0)

  const currentTransition = computed(() => getCurrentTransition(navDirection.value, currentSlideRoute.value, prevRoute.value))

  watch(currentSlideRoute, (next, prev) => {
    navDirection.value = next.no - prev.no
  })

  async function openInEditor(url?: string) {
    if (!__DEV__)
      return false
    if (url == null) {
      const slide = currentSlideRoute.value?.meta?.slide
      if (!slide)
        return false
      url = `${slide.filepath}:${slide.start}`
    }
    await fetch(`/__open-in-editor?file=${encodeURIComponent(url)}`)
    return true
  }

  const tocTree = useTocTree(slides)

  async function next() {
    clicksDirection.value = 1
    if (clicksTotal.value <= queryClicks.value)
      await nextSlide()
    else
      queryClicks.value += 1
  }

  async function prev() {
    clicksDirection.value = -1
    if (queryClicks.value <= 0)
      await prevSlide()
    else
      queryClicks.value -= 1
  }

  async function nextSlide() {
    clicksDirection.value = 1
    if (currentSlideNo.value < slides.value.length)
      await go(currentSlideNo.value + 1)
  }

  async function prevSlide(lastClicks = true) {
    clicksDirection.value = -1
    const next = Math.max(1, currentSlideNo.value - 1)
    await go(next)
    if (lastClicks && clicksTotal.value) {
      router?.replace({
        query: { ...router.currentRoute.value.query, clicks: clicksTotal.value },
      })
    }
  }

  function goFirst() {
    return go(1)
  }

  function goLast() {
    return go(total.value)
  }

  async function go(page: number | string, clicks?: number) {
    skipTransition.value = false
    await router?.push({
      path: getSlidePath(page),
      query: { ...router.currentRoute.value.query, clicks },
    })
  }

  return {
    slides,
    total,
    currentPath,
    currentSlideNo,
    currentPage: currentSlideNo,
    currentSlideRoute,
    currentLayout,
    currentTransition,
    clicksDirection,
    nextRoute,
    prevRoute,
    clicksContext,
    clicks,
    clicksTotal,
    hasNext,
    hasPrev,
    tocTree,
    navDirection,
    openInEditor,
    next,
    prev,
    go,
    goLast,
    goFirst,
    nextSlide,
    prevSlide,
  }
}

export function useFixedNav(
  currentSlideRoute: SlideRoute,
  clicksContext: ClicksContext,
): SlidevContextNav {
  const noop = async () => { }
  return {
    ...useNavBase(computed(() => currentSlideRoute), computed(() => clicksContext)),
    next: noop,
    prev: noop,
    nextSlide: noop,
    prevSlide: noop,
    goFirst: noop,
    goLast: noop,
    go: noop,
  }
}
