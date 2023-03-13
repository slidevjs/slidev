import type { ComputedRef, WritableComputedRef } from 'vue'
import { computed, nextTick, ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { SlidevContextNavClicks } from '../modules/context'
import { rawRoutes, router } from '../routes'

export function useNavClicks(
  clicks: WritableComputedRef<number>,
  currentRoute: ComputedRef<RouteRecordRaw | undefined>,
  currentPage: ComputedRef<number>,
): SlidevContextNavClicks {
  // force update collected elements when the route is fully resolved
  const routeForceRefresh = ref(0)
  nextTick(() => {
    router.afterEach(async () => {
      await nextTick()
      routeForceRefresh.value += 1
    })
  })

  const clicksElements = computed<HTMLElement[]>(() => {
    // eslint-disable-next-line no-unused-expressions
    routeForceRefresh.value
    return currentRoute.value?.meta?.__clicksElements || []
  })

  const clicksTotal = computed(() => +(currentRoute.value?.meta?.clicks ?? clicksElements.value.length))

  const hasNext = computed(() => currentPage.value < rawRoutes.length - 1 || clicks.value < clicksTotal.value)
  const hasPrev = computed(() => currentPage.value > 1 || clicks.value > 0)
  return {
    clicks,
    clicksElements,
    clicksTotal,
    hasNext,
    hasPrev,
  }
}
