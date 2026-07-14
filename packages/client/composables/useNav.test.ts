import type { ClicksContext, SlideRoute } from '@slidev/types'
import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { useNavBase } from './useNav'

vi.mock('#slidev/slides', async () => {
  const { ref } = await import('vue')
  return { slides: ref([]) }
})

vi.mock('../env', async () => {
  const { ref } = await import('vue')
  return {
    configs: {},
    slideAspect: ref(16 / 9),
  }
})

vi.mock('../state', async () => {
  const { ref } = await import('vue')
  return { hmrSkipTransition: ref(false) }
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
})
