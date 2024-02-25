import { sum } from '@antfu/utils'
import type { ClicksContext } from '@slidev/types'
import type { Ref } from 'vue'
import { ref, shallowReactive } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { currentRoute, isPrintMode, isPrintWithClicks, queryClicks, routeForceRefresh } from '../logic/nav'
import { normalizeAtProp } from '../logic/utils'
import { CLICKS_MAX } from '../constants'

/**
 * @internal
 */
export function useClicksContextBase(getCurrent: () => number, clicksOverrides?: number): ClicksContext {
  const relativeOffsets: ClicksContext['relativeOffsets'] = new Map()
  const map: ClicksContext['map'] = shallowReactive(new Map())

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
          delta: value + size - 1,
        }
      }
      else {
        return {
          start: value,
          end: value + size - 1,
          delta: 0,
        }
      }
    },
    register(el, resolved) {
      relativeOffsets.set(el, resolved.delta)
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
      return clicksOverrides
        ?? Math.max(0, ...[...map.values()].map(v => v.max || 0))
    },
  }
}

export function usePrimaryClicks(route: RouteRecordRaw | undefined): ClicksContext {
  if (route?.meta?.__clicksContext)
    return route.meta.__clicksContext
  const thisPath = +(route?.path ?? CLICKS_MAX)
  const context = useClicksContextBase(
    () => {
      const currentPath = +(currentRoute.value?.path ?? CLICKS_MAX)
      if (currentPath === thisPath)
        return queryClicks.value
      else if (currentPath > thisPath)
        return CLICKS_MAX
      else
        return 0
    },
    route?.meta?.clicks,
  )
  if (route?.meta)
    route.meta.__clicksContext = context
  return context
}

export function useFixedClicks(route?: RouteRecordRaw | undefined, currentInit = 0): [Ref<number>, ClicksContext] {
  const current = ref(currentInit)
  return [current, useClicksContextBase(() => current.value, route?.meta?.clicks)]
}
