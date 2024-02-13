import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { SlidevContext } from '../modules/context'
import { configs } from '../env'
import { useNav } from './useNav'

export function useContext(
  route: ComputedRef<RouteLocationNormalizedLoaded>,
): SlidevContext {
  const nav = useNav(route)
  return {
    nav,
    configs,
    themeConfigs: computed(() => configs.themeConfig),
  }
}
