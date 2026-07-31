import type { ClicksContext, SlideRoute } from '@slidev/types'
import type { SlidevContextNav } from './useNav'
import { renderToString } from '@vue/server-renderer'
import { provideLocal } from '@vueuse/core'
import { describe, expect, it, vi } from 'vitest'
import { computed, createSSRApp, defineComponent, h, reactive, ref } from 'vue'
import { injectionSlidevContext } from '../constants'
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
})
