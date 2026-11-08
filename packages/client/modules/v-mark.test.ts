import type { App, ObjectDirective, Ref } from 'vue'
import { annotate } from '@slidev/rough-notation'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useNav } from '../composables/useNav'
import { injectionCurrentPage } from '../constants'
import { resolveClick } from './v-click'
import { createVMarkDirective } from './v-mark'

vi.mock('@slidev/rough-notation', () => ({
  annotate: vi.fn(() => {
    let showing = false
    return {
      show: vi.fn(() => showing = true),
      hide: vi.fn(() => showing = false),
      isShowing: () => showing,
    }
  }),
}))

vi.mock('../composables/useNav', async () => {
  const { ref } = await import('vue')
  const nav = {
    currentPage: ref(1),
    isPrintMode: ref(false),
  }
  return {
    useNav: () => nav,
  }
})

vi.mock('./v-click', () => ({
  resolveClick: vi.fn(),
}))

vi.mock('../env', () => ({
  configs: {},
}))

const currentPage = useNav().currentPage as unknown as Ref<number>

let vMark!: ObjectDirective<HTMLElement>
createVMarkDirective().install({
  directive: (_name: string, directive: ObjectDirective<HTMLElement>) => vMark = directive,
} as unknown as App)

function mountMark(page: number, isActive: boolean) {
  vi.mocked(resolveClick).mockReturnValueOnce({
    isActive: ref(isActive),
  } as any)
  const el = {} as HTMLElement
  const binding = {
    value: '+0',
    modifiers: {},
    instance: {
      $: {
        provides: {
          [injectionCurrentPage as any]: ref(page),
        },
      },
    },
  } as any
  vMark.mounted!(el, binding, null as any, null as any)
  const annotation = vi.mocked(annotate).mock.results.at(-1)!.value
  return { el, binding, annotation }
}

function flush() {
  return new Promise(resolve => setTimeout(resolve))
}

describe('v-mark', () => {
  it('redraws shown marks once their preloaded slide becomes current', async () => {
    currentPage.value = 1
    const { annotation } = mountMark(2, true)
    expect(annotation.show).toHaveBeenCalledTimes(1)

    currentPage.value = 2
    await flush()
    expect(annotation.show).toHaveBeenCalledTimes(2)
  })

  it('does not redraw hidden marks, marks on other slides or unmounted marks', async () => {
    currentPage.value = 1
    const hidden = mountMark(2, false)
    const other = mountMark(3, true)
    const unmounted = mountMark(2, true)
    vMark.unmounted!(unmounted.el, unmounted.binding, null as any, null as any)

    currentPage.value = 2
    await flush()
    currentPage.value = 1
    await flush()

    expect(hidden.annotation.show).not.toHaveBeenCalled()
    expect(other.annotation.show).toHaveBeenCalledTimes(1)
    expect(unmounted.annotation.show).toHaveBeenCalledTimes(1)
  })
})
