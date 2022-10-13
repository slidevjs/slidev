import type { RouteRecordRaw } from 'vue-router'

export function getSlideClass(route?: RouteRecordRaw) {
  const no = route?.meta?.slide?.no
  if (no != null)
    return `slidev-page-${no}`
  return ''
}

/**
 * The height must be an integer (apply round) and it should honors the aspect ratio more as possible.
 * Also, to prevent errors on PDF export, we need to increase the height by 1px at time until the real
 * aspect ratio is equal or less than the requested one.
 * Doing this, we will prevent to create empty white pages after all single pages.
 */
export function getSlideHeightRespectingAspectAsPossible(requestedWidth: number, aspectRatio: number) {
  let calculatedHeight = Math.ceil(requestedWidth / aspectRatio)

  while (aspectRatio < (requestedWidth / calculatedHeight))
    calculatedHeight++

  return calculatedHeight
}
