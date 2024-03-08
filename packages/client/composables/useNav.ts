import type { ClicksContext, SlideRoute, TocItem } from '@slidev/types'
import type { ComputedRef, Ref, TransitionGroupProps, WritableComputedRef } from 'vue'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { RouteLocationNormalized, Router } from 'vue-router'
import { createSharedComposable } from '@vueuse/core'
import { logicOr } from '@vueuse/math'
import { getCurrentTransition } from '../logic/transition'
import { getSlide, getSlidePath } from '../logic/slides'
import { CLICKS_MAX } from '../constants'
import { skipTransition } from '../logic/hmr'
import { configs } from '../env'
import { useRouteQuery } from '../logic/route'
import { useTocTree } from './useTocTree'
import { createClicksContextBase } from './useClicks'
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

export interface SlidevContextNavState {
  router: Router
  currentRoute: ComputedRef<RouteLocationNormalized>
  isPrintMode: ComputedRef<boolean>
  isPrintWithClicks: ComputedRef<boolean>
  isEmbedded: ComputedRef<boolean>
  isPlaying: ComputedRef<boolean>
  isPresenter: ComputedRef<boolean>
  isNotesViewer: ComputedRef<boolean>
  isPresenterAvailable: ComputedRef<boolean>
  hasPrimarySlide: ComputedRef<boolean>
  currentSlideNo: ComputedRef<number>
  currentSlideRoute: ComputedRef<SlideRoute>
  clicksContext: ComputedRef<ClicksContext>
  queryClicksRaw: Ref<string>
  queryClicks: WritableComputedRef<number>
  getPrimaryClicks: (route: SlideRoute) => ClicksContext
}

export interface SlidevContextNavFull extends SlidevContextNav, SlidevContextNavState {}

export function useNavBase(
  currentSlideRoute: ComputedRef<SlideRoute>,
  clicksContext: ComputedRef<ClicksContext>,
  queryClicks: Ref<number> = ref(0),
  isPresenter: Ref<boolean>,
  router?: Router,
): SlidevContextNav {
  const total = computed(() => slides.value.length)

  const navDirection = ref(0)
  const clicksDirection = ref(0)

  const currentPath = computed(() => getSlidePath(currentSlideRoute.value, isPresenter.value))
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

  const tocTree = useTocTree(
    slides,
    currentSlideNo,
    currentSlideRoute,
  )

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
    await go(
      next,
      lastClicks
        ? getSlide(next)?.meta.__clicksContext?.total ?? CLICKS_MAX
        : undefined,
    )
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
      path: getSlidePath(page, isPresenter.value),
      query: {
        ...router.currentRoute.value.query,
        clicks: clicks || undefined,
      },
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
    ...useNavBase(
      computed(() => currentSlideRoute),
      computed(() => clicksContext),
      ref(CLICKS_MAX),
      ref(false),
    ),
    next: noop,
    prev: noop,
    nextSlide: noop,
    prevSlide: noop,
    goFirst: noop,
    goLast: noop,
    go: noop,
  }
}

const useNavState = createSharedComposable((): SlidevContextNavState => {
  const router = useRouter()

  const currentRoute = computed(() => router.currentRoute.value)
  const isPrintMode = computed(() => currentRoute.value.query.print !== undefined)
  const isPrintWithClicks = computed(() => currentRoute.value.query.print === 'clicks')
  const isEmbedded = computed(() => currentRoute.value.query.embedded !== undefined)
  const isPlaying = computed(() => currentRoute.value.name === 'play')
  const isPresenter = computed(() => currentRoute.value.name === 'presenter')
  const isNotesViewer = computed(() => currentRoute.value.name === 'notes')
  const isPresenterAvailable = computed(() => !isPresenter.value && (!configs.remote || currentRoute.value.query.password === configs.remote))
  const hasPrimarySlide = logicOr(isPlaying, isPresenter)

  const currentSlideNo = computed(() => hasPrimarySlide.value ? getSlide(currentRoute.value.params.no as string)?.no ?? 1 : 1)
  const currentSlideRoute = computed(() => slides.value[currentSlideNo.value - 1])

  const queryClicksRaw = useRouteQuery<string>('clicks', '0')

  const clicksContext = computed(() => getPrimaryClicks(currentSlideRoute.value))

  const queryClicks = computed({
    get() {
      if (clicksContext.value.disabled)
        return CLICKS_MAX
      let v = +(queryClicksRaw.value || 0)
      if (Number.isNaN(v))
        v = 0
      return v
    },
    set(v) {
      queryClicksRaw.value = v.toString()
    },
  })

  function getPrimaryClicks(
    route: SlideRoute,
  ): ClicksContext {
    if (route?.meta?.__clicksContext)
      return route.meta.__clicksContext

    const thisNo = route.no
    const context = createClicksContextBase(
      computed({
        get() {
          if (context.disabled)
            return CLICKS_MAX
          if (currentSlideNo.value === thisNo)
            return +(queryClicksRaw.value || 0) || 0
          else if (currentSlideNo.value > thisNo)
            return CLICKS_MAX
          else
            return 0
        },
        set(v) {
          if (currentSlideNo.value === thisNo)
            queryClicksRaw.value = Math.min(v, context.total).toString()
        },
      }),
      route?.meta?.clicks,
      () => isPrintMode.value && !isPrintWithClicks.value,
    )

    // On slide mounted, make sure the query is not greater than the total
    context.onMounted = () => {
      if (queryClicksRaw.value)
        queryClicksRaw.value = Math.min(+queryClicksRaw.value, context.total).toString()
    }

    if (route?.meta)
      route.meta.__clicksContext = context

    return context
  }

  return {
    router,
    currentRoute,
    isPrintMode,
    isPrintWithClicks,
    isEmbedded,
    isPlaying,
    isPresenter,
    isNotesViewer,
    isPresenterAvailable,
    hasPrimarySlide,
    currentSlideNo,
    currentSlideRoute,
    clicksContext,
    queryClicksRaw,
    queryClicks,
    getPrimaryClicks,
  }
})

export const useNav = createSharedComposable((): SlidevContextNavFull => {
  const state = useNavState()
  const router = useRouter()

  const nav = useNavBase(
    state.currentSlideRoute,
    state.clicksContext,
    state.queryClicks,
    state.isPresenter,
    router,
  )

  watch(
    [nav.total, state.currentRoute],
    async () => {
      if (state.hasPrimarySlide.value && !getSlide(state.currentRoute.value.params.no as string)) {
        // The current slide may has been removed. Redirect to the last slide.
        await nav.goLast()
      }
    },
    { flush: 'pre', immediate: true },
  )

  return {
    ...nav,
    ...state,
  }
})
