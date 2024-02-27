import { sum } from '@antfu/utils'
import type { ClicksContext } from '@slidev/types'
import type { Ref } from 'vue'
import { computed, ref, shallowReactive } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { currentRoute, isPrintMode, isPrintWithClicks, queryClicks, routeForceRefresh } from '../logic/nav'
import { normalizeAtProp } from '../logic/utils'
import { CLICKS_MAX } from '../constants'

function useClicksContextBase(current: Ref<number>, clicksOverrides?: number): ClicksContext {
  const relativeOffsets: ClicksContext['relativeOffsets'] = new Map()
  const map: ClicksContext['map'] = shallowReactive(new Map())

  return {
    get disabled() {
      return isPrintMode.value && !isPrintWithClicks.value
    },
    get current() {
      return current.value
    },
    set current(value) {
      current.value = value
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
  const current = computed({
    get() {
      const currentPath = +(currentRoute.value?.path ?? Number.NaN)
      if (!currentPath || Number.isNaN(currentPath))
        return 0
      if (currentPath === thisPath)
        return queryClicks.value
      else if (currentPath > thisPath)
        return CLICKS_MAX
      else
        return 0
    },
    set(v) {
      const currentPath = +(currentRoute.value?.path ?? Number.NaN)
      if (currentPath === thisPath)
        queryClicks.value = v
    },
  })
  const context = useClicksContextBase(
    current,
    route?.meta?.clicks,
  )
  if (route?.meta)
    route.meta.__clicksContext = context
  return context
}

export function useFixedClicks(route?: RouteRecordRaw | undefined, currentInit = 0): ClicksContext {
  return useClicksContextBase(ref(currentInit), route?.meta?.clicks)
}
