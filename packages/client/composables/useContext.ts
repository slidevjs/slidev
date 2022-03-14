import type { ComputedRef, WritableComputedRef } from 'vue'
import { computed } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { downloadPDF, next, nextSlide, openInEditor, prev, prevSlide } from '../logic/nav'
import { configs } from '../env'
import { useNav } from './useNav'
import { useNavClicks } from './useNavClicks'

export function useContext(
  route: ComputedRef<RouteLocationNormalizedLoaded>,
  clicks: WritableComputedRef<number>,
) {
  const nav = useNav(route)
  const navClicks = useNavClicks(clicks, nav.currentRoute, nav.currentPage)
  return {
    nav: {
      ...nav,
      ...navClicks,
      downloadPDF,
      next,
      nextSlide,
      openInEditor,
      prev,
      prevSlide,
    },
    configs,
    themeConfigs: computed(() => configs.themeConfig),
  }
}
