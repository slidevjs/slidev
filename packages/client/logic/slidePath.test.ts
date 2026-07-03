import type { SlideRoute } from '@slidev/types'
import { describe, expect, it } from 'vitest'
import { getSlideRoutePath } from './slidePath'

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
