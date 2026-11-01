import type { SlideRoute } from '@slidev/types'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { usePrintClicks } from './usePrintClicks'

const isPrintWithClicks = ref(false)

vi.mock('#slidev/slides', async () => {
  const { ref } = await import('vue')
  return { slides: ref([]) }
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
  const route = reactive({ name: 'print', params: { no: '1' }, query: {} })
  const router = { currentRoute: ref(route), push: vi.fn(), replace: vi.fn() }
  return {
    useRoute: () => route,
    useRouter: () => router,
  }
})

vi.mock('./useNav', async (importOriginal) => {
  const original = await importOriginal<typeof import('./useNav')>()
  return {
    ...original,
    useNav: () => ({ isPrintWithClicks }),
  }
})

// the click step of every page PrintSlide.vue renders
function pages(frontmatter: Record<string, any>, withClicks = false, clicks?: number) {
  isPrintWithClicks.value = withClicks
  const route = {
    no: 1,
    meta: { slide: { frontmatter }, clicks },
  } as unknown as SlideRoute
  const { clicks0, firstClick, extraClicks } = usePrintClicks(route)
  return firstClick.value === null ? [] : [clicks0.current, ...extraClicks.value]
}

describe('usePrintClicks', () => {
  it('follows the with-clicks option by default', () => {
    expect(pages({}, false, 3)).toEqual([3])
    expect(pages({}, true, 3)).toEqual([0, 1, 2, 3])
  })

  it('overrides the with-clicks option with exportClicks', () => {
    expect(pages({ exportClicks: false }, true, 3)).toEqual([3])
    expect(pages({ exportClicks: true }, false, 3)).toEqual([0, 1, 2, 3])
  })

  it('renders only the listed click steps', () => {
    expect(pages({ exportClicks: [0, 2, 5] }, false, 3)).toEqual([0, 2, 3])
    expect(pages({ exportClicks: '2-' }, false, 3)).toEqual([2, 3])
    expect(pages({ exportClicks: [0, 'last'] }, true, 3)).toEqual([0, 3])
    expect(pages({ exportClicks: [2] }, false, 3)).toEqual([2])
    expect(pages({ exportClicks: [5] }, false, 3)).toEqual([3])
    expect(pages({ exportClicks: [] }, true, 3)).toEqual([])
  })

  it('respects clicksStart', () => {
    expect(pages({ clicksStart: 1, exportClicks: true }, false, 3)).toEqual([1, 2, 3])
    expect(pages({ clicksStart: 1, exportClicks: [0, 2] }, false, 3)).toEqual([1, 2])
    expect(pages({ clicksStart: 1 }, true, 3)).toEqual([1, 2, 3])
  })

  it('renders a single page while the total is not known yet', () => {
    // without a `clicks` override the total is 0 until the slide is mounted
    expect(pages({}, false)).toEqual([0])
    expect(pages({ exportClicks: true }, true)).toEqual([0])
    expect(pages({ exportClicks: [2, 5] }, false)).toEqual([0])
    expect(pages({ exportClicks: [] }, false)).toEqual([])
  })
})
