import type { ClicksContext, SlideRoute } from '@slidev/types'
import type { Router } from 'vue-router'
import type { SlidevContextNav } from './useNav'
import { renderToString } from '@vue/server-renderer'
import { provideLocal } from '@vueuse/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, createSSRApp, defineComponent, h, reactive, ref } from 'vue'
import { injectionSlidevContext } from '../constants'
import { configs } from '../env'
import { useNav, useNavBase } from './useNav'

vi.mock('#slidev/slides', async () => {
  const { ref } = await import('vue')
  return {
    slides: ref([
      {
        no: 1,
        meta: {
          slide: { frontmatter: { title: 'First' } },
        },
      },
      {
        no: 2,
        meta: {
          slide: { frontmatter: { title: 'Second' } },
        },
      },
    ]),
  }
})

vi.mock('../env', async () => {
  const { ref } = await import('vue')
  return {
    configs: { remote: false },
    slideAspect: ref(16 / 9),
  }
})

vi.mock('../state', async () => {
  const { ref } = await import('vue')
  return { hmrSkipTransition: ref(false) }
})

vi.mock('vue-router', async () => {
  const { reactive, ref } = await import('vue')
  const route = reactive({
    name: 'export',
    params: { no: '1' },
    query: {},
  })
  const router = {
    currentRoute: ref(route),
    push: vi.fn(),
    replace: vi.fn(),
  }
  return {
    useRoute: () => route,
    useRouter: () => router,
  }
})

function route(no: number, frontmatter: Record<string, any>): SlideRoute {
  return {
    no,
    meta: {
      slide: { frontmatter },
    },
  } as unknown as SlideRoute
}

describe('useNavBase', () => {
  it('exposes reactive frontmatter for the current slide', () => {
    const currentRoute = ref(route(1, { title: 'Intro', section: 'start' }))
    const nav = useNavBase(
      computed(() => currentRoute.value),
      computed(() => ({ current: 0, clicksStart: 0, total: 0 }) as ClicksContext),
      ref(0),
      ref(false),
      ref(false),
    )

    expect(nav.currentFrontmatter.value).toEqual({
      title: 'Intro',
      section: 'start',
    })

    currentRoute.value = route(2, { title: 'Details', section: 'body' })

    expect(nav.currentFrontmatter.value).toEqual({
      title: 'Details',
      section: 'body',
    })
  })

  it('uses the slide-local navigation context while rendering exported slides', async () => {
    vi.stubGlobal('location', { search: '' })
    let observedNav: SlidevContextNav | undefined
    const localNav = {
      currentSlideNo: computed(() => 2),
      currentPage: computed(() => 2),
      currentSlideRoute: computed(() => route(2, { title: 'Second' })),
      tocTree: computed(() => [
        { no: 1, active: false },
        { no: 2, active: true },
      ]),
    } as unknown as SlidevContextNav

    const Child = defineComponent({
      setup() {
        observedNav = useNav()
        return () => h('span')
      },
    })
    const App = defineComponent({
      setup() {
        provideLocal(injectionSlidevContext, reactive({
          nav: localNav,
          configs: {},
          themeConfigs: {},
        }) as any)
        return () => h(Child)
      },
    })

    await renderToString(createSSRApp(App))

    expect(observedNav?.currentSlideNo.value).toBe(2)
    expect(observedNav?.currentSlideRoute.value.meta.slide.frontmatter.title).toBe('Second')
    expect(observedNav?.tocTree.value[1].active).toBe(true)
  })

  it('falls back to the shared nav when there is no injection context', () => {
    // Directive hooks such as `v-motion`'s and `v-mark`'s `mounted` call
    // `useNav()` while no component instance is current. There is no
    // slide-local context to read there, so the shared nav is the answer.
    vi.stubGlobal('location', { search: '' })

    expect(() => useNav()).not.toThrow()
    expect(useNav().currentSlideNo.value).toBe(1)
  })
})

describe('advanceDebounce', () => {
  let now: number

  beforeEach(() => {
    now = 0
    configs.advanceDebounce = 100
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('location', { search: '' })
  })

  afterEach(() => {
    configs.advanceDebounce = 0
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function createNav(totals = [3, 3], start = 0, print = false) {
    const current = ref(route(1, { clicksStart: start }))
    const queryClicks = ref(start)
    const router = {
      currentRoute: ref({ name: 'play', query: {} }),
      push: vi.fn(async (to: { path: string, query: { clicks?: string } }) => {
        current.value = route(Number(to.path.split('/').pop()), {})
        queryClicks.value = Number(to.query.clicks ?? 0)
      }),
    }
    const nav = useNavBase(
      computed(() => current.value),
      computed(() => ({
        current: queryClicks.value,
        clicksStart: start,
        total: totals[current.value.no - 1],
      }) as ClicksContext),
      queryClicks,
      ref(false),
      ref(print),
      router as unknown as Router,
    )
    return { nav, queryClicks, router }
  }

  it('advances immediately and drops duplicates without trailing work or extending the window', async () => {
    const { nav, queryClicks } = createNav()
    const first = nav.next()
    expect(queryClicks.value).toBe(1)
    await first
    now = 40
    await nav.next()
    now = 99
    await nav.next()
    expect(queryClicks.value).toBe(1)
    now = 100
    await nav.next()
    expect(queryClicks.value).toBe(2)
    now = 1000
    expect(queryClicks.value).toBe(2)
    await nav.next()
    expect(queryClicks.value).toBe(3)
  })

  it.each([undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])('leaves navigation unrestricted with %s', async (interval) => {
    Object.assign(configs, { advanceDebounce: interval })
    const { nav, queryClicks } = createNav()
    await nav.next()
    await nav.next()
    expect(queryClicks.value).toBe(2)
    await nav.nextSlide()
    expect(nav.currentSlideNo.value).toBe(2)
  })

  it('supports a configurable window', async () => {
    configs.advanceDebounce = 250
    const { nav, queryClicks } = createNav()
    await nav.next()
    now = 100
    await nav.next()
    expect(queryClicks.value).toBe(1)
    now = 250
    await nav.next()
    expect(queryClicks.value).toBe(2)
  })

  it('shares the window between click advances and slide advances', async () => {
    const { nav, queryClicks } = createNav()
    await nav.next()
    now = 30
    await nav.nextSlide()
    expect(nav.currentSlideNo.value).toBe(1)
    now = 100
    await nav.nextSlide()
    expect(nav.currentSlideNo.value).toBe(2)
    now = 130
    await nav.next()
    expect(queryClicks.value).toBe(0)
    now = 200
    await nav.next()
    expect(queryClicks.value).toBe(1)
  })

  it('does not double-guard next at a slide boundary or reset on the route change', async () => {
    const { nav, queryClicks, router } = createNav([0, 3])
    await nav.next()
    expect(nav.currentSlideNo.value).toBe(2)
    expect(router.push).toHaveBeenCalledTimes(1)
    now = 50
    await nav.next()
    expect(queryClicks.value).toBe(0)
    now = 100
    await nav.next()
    expect(queryClicks.value).toBe(1)
  })

  it('reserves the window before asynchronous routing completes', async () => {
    const { nav, router } = createNav([0, 0])
    let finish!: () => void
    router.push.mockImplementationOnce(() => new Promise<void>((resolve) => {
      finish = resolve
    }))
    const first = nav.next()
    now = 30
    await nav.nextSlide()
    expect(router.push).toHaveBeenCalledTimes(1)
    finish()
    await first
  })

  it('preserves click offsets, the final build, and the end of the deck', async () => {
    const { nav, queryClicks, router } = createNav([3, 0], 2)
    await nav.next()
    expect(queryClicks.value).toBe(3)
    now = 30
    await nav.next()
    expect(nav.currentSlideNo.value).toBe(1)
    now = 100
    await nav.next()
    expect(nav.currentSlideNo.value).toBe(2)
    now = 200
    await nav.next()
    await nav.nextSlide()
    expect(router.push).toHaveBeenCalledTimes(1)
  })

  it('allows backward clicks immediately and an immediate corrective advance', async () => {
    const { nav, queryClicks } = createNav()
    await nav.next()
    now = 10
    await nav.prev()
    expect(queryClicks.value).toBe(0)
    expect(nav.clicksDirection.value).toBe(-1)
    await nav.next()
    expect(queryClicks.value).toBe(1)
  })

  it.each(['prevSlide', 'go', 'goFirst', 'goLast'] as const)('resets after %s', async (action) => {
    const { nav, queryClicks } = createNav()
    await nav.nextSlide()
    now = 10
    if (action === 'go')
      await nav.go(1)
    else
      await nav[action]()
    await nav.next()
    expect(queryClicks.value).toBe(1)
  })

  it('never suppresses consecutive backward navigation', async () => {
    const { nav, queryClicks } = createNav()
    await nav.go(2, 3)
    await nav.prev()
    await nav.prev()
    expect(queryClicks.value).toBe(1)
    await nav.prevSlide()
    expect(nav.currentSlideNo.value).toBe(1)
    await nav.prevSlide()
    expect(nav.currentSlideNo.value).toBe(1)
  })

  it('preserves nextSlide(true)', async () => {
    const { nav, router } = createNav()
    await nav.nextSlide(true)
    expect(router.push.mock.calls[0][0].query.clicks).toBe('999999')
  })

  it('does not suppress navigation in print/export mode', async () => {
    const { nav, queryClicks } = createNav([3, 3], 0, true)
    await nav.next()
    await nav.next()
    expect(queryClicks.value).toBe(2)
    await nav.nextSlide()
    expect(nav.currentSlideNo.value).toBe(2)
  })

  it('keeps independent navigation contexts independent', async () => {
    const first = createNav()
    const second = createNav()
    await first.nav.next()
    await second.nav.next()
    expect(first.queryClicks.value).toBe(1)
    expect(second.queryClicks.value).toBe(1)
  })
})
