import type { RouteRecordRaw } from 'vue-router'

export function getSlideClass(route?: RouteRecordRaw) {
  const no = route?.meta?.slide?.no
  if (no != null)
    return `slidev-page-${no}`
  return ''
}

/**
 * To honor the aspect ratio more as possible, we need to approximate the height to the next integer.
 * Doing this, we will prevent on print, to create an additional empty white page after each page.
 */
export function getSlideHeightRespectingAspectAsPossible(requestedWidth: number, aspectRatio: number) {
  return Math.ceil(requestedWidth / aspectRatio)
}
