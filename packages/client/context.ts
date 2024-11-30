import { injectLocal, objectOmit } from '@vueuse/core'
import { computed, ref, toRef } from 'vue'
import {
  FRONTMATTER_FIELDS,
  HEADMATTER_FIELDS,
  injectionClicksContext,
  injectionCurrentPage,
  injectionFrontmatter,
  injectionRenderContext,
  injectionRoute,
  injectionSlideScale,
  injectionSlidevContext,
  injectionSlideZoom,
} from './constants'

/**
 * Get the current slide context, should be called inside the setup function of a component inside slide
 */
export function useSlideContext() {
  const $slidev = injectLocal(injectionSlidevContext)!
  const $nav = toRef($slidev, 'nav')
  const $clicksContext = injectLocal(injectionClicksContext)!.value
  const $clicks = toRef($clicksContext, 'current')
  const $page = injectLocal(injectionCurrentPage)!
  const $renderContext = injectLocal(injectionRenderContext)!
  const $frontmatter = injectLocal(injectionFrontmatter, {})
  const $route = injectLocal(injectionRoute, undefined)
  const $scale = injectLocal(injectionSlideScale, ref(1))
  const $zoom = injectLocal(injectionSlideZoom, computed(() => 1))

  return {
    $slidev,
    $nav,
    $clicksContext,
    $clicks,
    $page,
    $route,
    $renderContext,
    $frontmatter,
    $scale,
    $zoom,
  }
}

export type SlideContext = ReturnType<typeof useSlideContext>

/**
 * Convert frontmatter options to props for v-bind
 * It removes known options fields, and expose an extra `frontmatter` field that contains full frontmatter
 *
 * @internal
 */
export function frontmatterToProps(frontmatter: Record<string, any>, pageNo: number) {
  return {
    ...objectOmit(frontmatter, pageNo === 0 ? HEADMATTER_FIELDS : FRONTMATTER_FIELDS),
    frontmatter,
  }
}
