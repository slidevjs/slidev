import type { SlideRoute } from '@slidev/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { currentOverviewPage, downOverviewPage, nextOverviewPage, overviewRowCount, prevOverviewPage, upOverviewPage } from './overview'
import { slides } from './slides'

vi.mock('./slides', async () => {
  const { ref } = await import('vue')
  return { slides: ref([]) }
})

function setSlides(positions: [number, number][]) {
  slides.value = positions.map(([gridCol, gridRow], idx) => ({
    no: idx + 1,
    meta: { slide: { gridCol, gridRow } },
  } as SlideRoute))
}

beforeEach(() => {
  currentOverviewPage.value = 1
  overviewRowCount.value = 2
})

describe('overview navigation', () => {
  it('follows columns and rows in a nested deck, stopping at grid boundaries', () => {
    setSlides([[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [2, 0]])
    downOverviewPage()
    expect(currentOverviewPage.value).toBe(2)
    downOverviewPage()
    downOverviewPage()
    expect(currentOverviewPage.value).toBe(3)
    nextOverviewPage()
    expect(currentOverviewPage.value).toBe(4)
    downOverviewPage()
    expect(currentOverviewPage.value).toBe(5)
    upOverviewPage()
    upOverviewPage()
    expect(currentOverviewPage.value).toBe(4)
    nextOverviewPage()
    nextOverviewPage()
    downOverviewPage()
    expect(currentOverviewPage.value).toBe(6)
    prevOverviewPage()
    expect(currentOverviewPage.value).toBe(4)
    prevOverviewPage()
    prevOverviewPage()
    expect(currentOverviewPage.value).toBe(1)
  })

  it('preserves wrapped navigation for linear decks', () => {
    setSlides([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]])
    nextOverviewPage()
    expect(currentOverviewPage.value).toBe(2)
    downOverviewPage()
    expect(currentOverviewPage.value).toBe(4)
    downOverviewPage()
    expect(currentOverviewPage.value).toBe(5)
    upOverviewPage()
    expect(currentOverviewPage.value).toBe(3)
    prevOverviewPage()
    expect(currentOverviewPage.value).toBe(2)
    upOverviewPage()
    expect(currentOverviewPage.value).toBe(1)
  })
})
