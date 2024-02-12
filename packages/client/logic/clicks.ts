import { sum } from '@antfu/utils'
import type { ClicksContext } from '@slidev/types'
import type { Ref } from 'vue'
import { ref, shallowReactive } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { currentRoute, isPrintMode, isPrintWithClicks, queryClicks, routeForceRefresh } from './nav'
import { safeParseNumber } from './utils'

export function usePrimaryClicks(route: RouteRecordRaw | undefined): ClicksContext {
  if (route?.meta?.__clicksContext)
    return route.meta.__clicksContext
  const thisPath = +(route?.path ?? 99999)

  const relativeOffsets = new Map()
  const map = shallowReactive(new Map())

  const context: ClicksContext = {
    get disabled() {
      return isPrintMode.value && !isPrintWithClicks.value
    },
    get current() {
      const currentPath = +(currentRoute.value?.path ?? 99999)
      if (currentPath === thisPath)
        return queryClicks.value
      else if (currentPath > thisPath)
        return 99999
      else
        return 0
    },
    relativeOffsets,
    map,
    register(el, resolved) {
      relativeOffsets.set(el, resolved.relativeDelta)
      map.set(el, resolved)
    },
    unregister(el) {
      relativeOffsets.delete(el)
      map.delete(el)
    },
    get currentOffset() {
      // eslint-disable-next-line no-unused-expressions
      routeForceRefresh.value
      return sum(...relativeOffsets.values())
    },
    get total() {
      // eslint-disable-next-line no-unused-expressions
      routeForceRefresh.value
      return route?.meta?.clicks ?? (map?.size
        ? Math.max(...[...map.values()].map(v => v.max))
        : 0)
    },
  }
  route?.meta && (route.meta.__clicksContext = context)
  return context
}

export function useFixedClicks(route: RouteRecordRaw | undefined, currentInit = 0): [Ref<number>, ClicksContext] {
  const current = ref(currentInit)
  const relativeOffsets = new Map()
  const map = shallowReactive(new Map())

  return [current, {
    get disabled() {
      return isPrintMode.value && !isPrintWithClicks.value
    },
    get current() {
      return current.value
    },
    set current(_v) {
    },
    relativeOffsets,
    map,
    register(el, resolved) {
      relativeOffsets.set(el, resolved.relativeDelta)
      map.set(el, resolved)
    },
    unregister(el) {
      relativeOffsets.delete(el)
      map.delete(el)
    },
    get currentOffset() {
      // eslint-disable-next-line no-unused-expressions
      routeForceRefresh.value
      return sum(...relativeOffsets.values())
    },
    get total() {
      // eslint-disable-next-line no-unused-expressions
      routeForceRefresh.value
      return route?.meta?.clicks ?? (map?.size
        ? Math.max(...[...map.values()].map(v => v.max))
        : 0)
    },
  }]
}

/**
 *   '+3' => '+3'
 *   '-3' => '-3'
 *    '3' => 3
 *      3 => 3
 */
export function normalizeAtProp(at: string | number = '+1') {
  if (typeof at === 'string' && '+-'.includes(at[0]))
    return at
  return safeParseNumber(at)
}
