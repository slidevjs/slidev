import type { SlideRoute } from '@slidev/types'
import { describe, expect, it } from 'vitest'
import { getPrintSlideAnchorId, getSlideRoutePath } from './slidePath'

function route(no: number, routeAlias?: string): SlideRoute {
  return {
    no,
    meta: {
      slide: {
        frontmatter: {
          routeAlias,
        },
      },
    },
  } as unknown as SlideRoute
}

describe('getSlideRoutePath', () => {
  it('returns router paths without Vite base', () => {
    expect(getSlideRoutePath(route(2), false)).toBe('/2')
    expect(getSlideRoutePath(route(2), true)).toBe('/presenter/2')
    expect(getSlideRoutePath(route(2), false, true)).toBe('/export/2')
  })

  it('uses route aliases', () => {
    expect(getSlideRoutePath(route(2, 'intro'), false)).toBe('/intro')
    expect(getSlideRoutePath(route(2, 'intro'), true)).toBe('/presenter/intro')
  })
})

describe('getPrintSlideAnchorId', () => {
  it('depends on the slide number only, so it is the same however many clicks the slide has', () => {
    expect(getPrintSlideAnchorId(2)).toBe('slide-2')
    expect(getPrintSlideAnchorId('2')).toBe(getPrintSlideAnchorId(2))
    expect(getPrintSlideAnchorId(12)).not.toBe(getPrintSlideAnchorId(2))
  })

  it('never equals a print container id (`NNN-NN`), which would make a link ambiguous', () => {
    for (const no of [1, 2, 12, 123])
      expect(getPrintSlideAnchorId(no)).not.toMatch(/^\d{3}-\d{2}$/)
  })
})
