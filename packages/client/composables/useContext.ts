import type { ComputedRef, WritableComputedRef } from 'vue'
import { computed } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { downloadPDF, next, nextSlide, openInEditor, prev, prevSlide } from '../logic/nav'
import { configs } from '../env'
import { useNav } from './useNav'

export function useContext(
  route: ComputedRef<RouteLocationNormalizedLoaded>,
  clicks: WritableComputedRef<number>,
) {
  const nav = useNav(route, clicks)
  return {
    nav: {
      ...nav,
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
