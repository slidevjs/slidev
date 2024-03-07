import { sum } from '@antfu/utils'
import type { ClicksContext, SlideRoute } from '@slidev/types'
import type { Ref } from 'vue'
import { computed, ref, shallowReactive } from 'vue'
import { currentSlideNo, isPrintMode, isPrintWithClicks } from '../logic/nav'
import { normalizeAtProp } from '../logic/utils'
import { CLICKS_MAX } from '../constants'
import { routeForceRefresh, useRouteQuery } from '../logic/route'

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
    onMounted() {},
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
      return clicksOverrides ?? Math.max(0, ...[...map.values()].map(v => v.max || 0))
    },
  }
}

const queryClicksRaw = useRouteQuery('clicks', '0')

export function usePrimaryClicks(route: SlideRoute): ClicksContext {
  if (route?.meta?.__clicksContext)
    return route.meta.__clicksContext

  const thisNo = route.no
  const current = computed({
    get() {
      // eslint-disable-next-line ts/no-use-before-define
      if (context.disabled)
        return CLICKS_MAX
      if (currentSlideNo.value === thisNo)
        return +(queryClicksRaw.value || 0) || 0
      else if (currentSlideNo.value > thisNo)
        return CLICKS_MAX
      else
        return 0
    },
    set(v) {
      if (currentSlideNo.value === thisNo) {
        // eslint-disable-next-line ts/no-use-before-define
        queryClicksRaw.value = Math.min(v, context.total).toString()
      }
    },
  })
  const context = useClicksContextBase(
    current,
    route?.meta?.clicks,
  )

  // On slide mounted, make sure the query is not greater than the total
  context.onMounted = () => {
    if (queryClicksRaw.value)
      queryClicksRaw.value = Math.min(queryClicksRaw.value, context.total)
  }

  if (route?.meta)
    route.meta.__clicksContext = context
  return context
}

export function useFixedClicks(route?: SlideRoute | undefined, currentInit = 0): ClicksContext {
  return useClicksContextBase(ref(currentInit), route?.meta?.clicks)
}
