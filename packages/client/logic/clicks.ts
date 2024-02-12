import { sum } from '@antfu/utils'
import type { ClicksContext } from '@slidev/types'
import type { Ref } from 'vue'
import { ref, shallowReactive } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { currentRoute, isPrintMode, isPrintWithClicks, queryClicks, routeForceRefresh } from './nav'

/**
 *   '+3' => '+3'
 *   '-3' => '-3'
 *    '3' => 3
 *      3 => 3
 */
export function normalizeAtProp(at: string | number = '+1'): [isRelative: boolean, value: number] {
  let n = +at
  if (Number.isNaN(n)) {
    console.warn('[slidev] Invalid click position:', at)
    n = 0
  }
  return [
    typeof at === 'string' && '+-'.includes(at[0]),
    n,
  ]
}

function useClicksContextBase(route: RouteRecordRaw | undefined, getCurrent: () => number): ClicksContext {
  const relativeOffsets = new Map()
  const map = shallowReactive(new Map())
  return {
    get disabled() {
      return isPrintMode.value && !isPrintWithClicks.value
    },
    get current() {
      return getCurrent()
    },
    relativeOffsets,
    map,
    resolve(at, size = 1) {
      const [isRelative, value] = normalizeAtProp(at)
      if (isRelative) {
        const offset = this.currentOffset
        return {
          start: offset + value,
          end: offset + value + size - 1,
          relativeDelta: value + size - 1,
        }
      }
      else {
        return {
          start: value,
          end: value + size - 1,
          relativeDelta: 0,
        }
      }
    },
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
      return route?.meta?.clicks
        ?? Math.max(0, ...[...map.values()].map(v => v.max))
    },
  }
}

export function usePrimaryClicks(route: RouteRecordRaw | undefined): ClicksContext {
  if (route?.meta?.__clicksContext)
    return route.meta.__clicksContext
  const thisPath = +(route?.path ?? 99999)
  const context = useClicksContextBase(route, () => {
    const currentPath = +(currentRoute.value?.path ?? 99999)
    if (currentPath === thisPath)
      return queryClicks.value
    else if (currentPath > thisPath)
      return 99999
    else
      return 0
  })
  route?.meta && (route.meta.__clicksContext = context)
  return context
}

export function useFixedClicks(route: RouteRecordRaw | undefined, currentInit = 0): [Ref<number>, ClicksContext] {
  const current = ref(currentInit)
  return [current, useClicksContextBase(route, () => current.value)]
}
