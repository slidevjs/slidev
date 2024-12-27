import type { ClicksContext, SlideRoute, TocItem } from '@slidev/types'
import type { ComputedRef, Ref, TransitionGroupProps, WritableComputedRef } from 'vue'
import type { RouteLocationNormalized, Router } from 'vue-router'
import { slides } from '#slidev/slides'
import { clamp } from '@antfu/utils'
import { parseRangeString } from '@slidev/parser/utils'
import { createSharedComposable } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CLICKS_MAX } from '../constants'
import { configs } from '../env'
import { useRouteQuery } from '../logic/route'
import { getSlide, getSlidePath } from '../logic/slides'
import { getCurrentTransition } from '../logic/transition'
import { hmrSkipTransition } from '../state'
import { createClicksContextBase } from './useClicks'
import { useTocTree } from './useTocTree'

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
  clicksStart: ComputedRef<number>
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
  nextSlide: (lastClicks?: boolean) => Promise<void>
  /** Go to previous slide */
  prevSlide: (lastClicks?: boolean) => Promise<void>
  /** Go to slide */
  go: (no: number | string, clicks?: number, force?: boolean) => Promise<void>
  /** Go to the first slide */
  goFirst: () => Promise<void>
  /** Go to the last slide */
  goLast: () => Promise<void>

  /** Enter presenter mode */
  enterPresenter: () => void
  /** Exit presenter mode */
  exitPresenter: () => void
}

export interface SlidevContextNavState {
  router: Router
  currentRoute: ComputedRef<RouteLocationNormalized>
  isPrintMode: ComputedRef<boolean>
  isPrintWithClicks: Ref<boolean>
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
  printRange: Ref<number[]>
  getPrimaryClicks: (route: SlideRoute) => ClicksContext
}

export interface SlidevContextNavFull extends SlidevContextNav, SlidevContextNavState { }

export function useNavBase(
  currentSlideRoute: ComputedRef<SlideRoute>,
  clicksContext: ComputedRef<ClicksContext>,
  queryClicks: Ref<number> = ref(0),
  isPresenter: Ref<boolean>,
  isPrint: Ref<boolean>,
  router?: Router,
): SlidevContextNav {
  const total = computed(() => slides.value.length)

  const navDirection = ref(0)
  const clicksDirection = ref(0)

  const currentPath = computed(() => getSlidePath(currentSlideRoute.value, isPresenter.value))
  const currentSlideNo = computed(() => currentSlideRoute.value.no)
  const currentLayout = computed(() => currentSlideRoute.value.meta?.layout || (currentSlideNo.value === 1 ? 'cover' : 'default'))

  const clicks = computed(() => clicksContext.value.current)
  const clicksStart = computed(() => clicksContext.value.clicksStart)
  const clicksTotal = computed(() => clicksContext.value.total)
  const nextRoute = computed(() => slides.value[Math.min(slides.value.length, currentSlideNo.value + 1) - 1])
  const prevRoute = computed(() => slides.value[Math.max(1, currentSlideNo.value - 1) - 1])
  const hasNext = computed(() => currentSlideNo.value < slides.value.length || clicks.value < clicksTotal.value)
  const hasPrev = computed(() => currentSlideNo.value > 1 || clicks.value > 0)

  const currentTransition = computed(() => isPrint.value ? undefined : getCurrentTransition(navDirection.value, currentSlideRoute.value, prevRoute.value))

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
    if (queryClicks.value <= clicksStart.value)
      await prevSlide(true)
    else
      queryClicks.value -= 1
  }

  async function nextSlide(lastClicks = false) {
    clicksDirection.value = 1
    if (currentSlideNo.value < slides.value.length) {
      await go(
        currentSlideNo.value + 1,
        lastClicks && !isPrint.value ? CLICKS_MAX : undefined,
      )
    }
  }

  async function prevSlide(lastClicks = false) {
    clicksDirection.value = -1
    if (currentSlideNo.value > 1) {
      await go(
        currentSlideNo.value - 1,
        lastClicks && !isPrint.value ? CLICKS_MAX : undefined,
      )
    }
  }

  function goFirst() {
    return go(1)
  }

  function goLast() {
    return go(total.value)
  }

  async function go(no: number | string, clicks: number = 0, force = false) {
    hmrSkipTransition.value = false
    const pageChanged = currentSlideNo.value !== no
    const clicksChanged = clicks !== queryClicks.value
    const meta = getSlide(no)?.meta
    const clicksStart = meta?.slide?.frontmatter.clicksStart ?? 0
    clicks = clamp(clicks, clicksStart, meta?.__clicksContext?.total ?? CLICKS_MAX)
    if (force || pageChanged || clicksChanged) {
      await router?.push({
        path: getSlidePath(no, isPresenter.value, router.currentRoute.value.name === 'export'),
        query: {
          ...router.currentRoute.value.query,
          clicks: clicks === 0 ? undefined : clicks.toString(),
          embedded: location.search.includes('embedded') ? 'true' : undefined,
        },
      })
    }
  }

  function enterPresenter() {
    router?.push({
      path: getSlidePath(currentSlideNo.value, true),
      query: { ...router.currentRoute.value.query },
    })
  }
  function exitPresenter() {
    router?.push({
      path: getSlidePath(currentSlideNo.value, false),
      query: { ...router.currentRoute.value.query },
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
    clicksStart,
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
    enterPresenter,
    exitPresenter,
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
  const currentRoute = useRoute()

  const query = computed(() => {
    // eslint-disable-next-line ts/no-unused-expressions
    router.currentRoute.value.query
    return new URLSearchParams(location.search)
  })
  const isPrintMode = computed(() => query.value.has('print') || currentRoute.name === 'export')
  const isPrintWithClicks = ref(query.value.get('print') === 'clicks')
  const isEmbedded = computed(() => query.value.has('embedded'))
  const isPlaying = computed(() => currentRoute.name === 'play')
  const isPresenter = computed(() => currentRoute.name === 'presenter')
  const isNotesViewer = computed(() => currentRoute.name === 'notes')
  const isPresenterAvailable = computed(() => !isPresenter.value && (!configs.remote || query.value.get('password') === configs.remote))
  const hasPrimarySlide = computed(() => !!currentRoute.params.no)
  const currentSlideNo = computed(() => hasPrimarySlide.value ? getSlide(currentRoute.params.no as string)?.no ?? 1 : 1)
  const currentSlideRoute = computed(() => slides.value[currentSlideNo.value - 1])
  const printRange = ref(parseRangeString(slides.value.length, currentRoute.query.range as string | undefined))

  const queryClicksRaw = useRouteQuery<string>('clicks', '0')

  const clicksContext = computed(() => getPrimaryClicks(currentSlideRoute.value))

  const queryClicks = computed({
    get() {
      let v = +(queryClicksRaw.value || 0)
      if (Number.isNaN(v))
        v = 0
      return v
    },
    set(v) {
      hmrSkipTransition.value = false
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
          if (currentSlideNo.value === thisNo)
            return Math.max(+(queryClicksRaw.value ?? 0), context.clicksStart)
          else if (currentSlideNo.value > thisNo)
            return CLICKS_MAX
          else
            return context.clicksStart
        },
        set(v) {
          if (currentSlideNo.value === thisNo)
            queryClicksRaw.value = v.toString()
        },
      }),
      route?.meta.slide?.frontmatter.clicksStart ?? 0,
      route?.meta.clicks,
    )

    if (route?.meta)
      route.meta.__clicksContext = context

    return context
  }

  return {
    router,
    currentRoute: computed(() => currentRoute),
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
    printRange,
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
    state.isPrintMode,
    router,
  )

  watch(
    [nav.total, state.currentRoute],
    async () => {
      const no = state.currentRoute.value.params.no as string
      if (state.hasPrimarySlide.value && !getSlide(no)) {
        if (no && no !== 'index.html') {
          // The current slide may has been removed. Redirect to the last slide.
          await nav.go(nav.total.value, 0, true)
        }
        else {
          // Redirect to the first slide
          await nav.go(1, 0, true)
        }
      }
    },
    { flush: 'pre', immediate: true },
  )

  return {
    ...nav,
    ...state,
  }
})
