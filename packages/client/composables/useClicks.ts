import { sum } from '@antfu/utils'
import type { ClicksContext, SlideRoute } from '@slidev/types'
import type { Ref } from 'vue'
import { ref, shallowReactive } from 'vue'
import { normalizeAtProp } from '../logic/utils'
import { routeForceRefresh } from '../logic/route'

export function createClicksContextBase(
  current: Ref<number>,
  clicksOverrides?: number,
): ClicksContext {
  const relativeOffsets: ClicksContext['relativeOffsets'] = new Map()
  const map: ClicksContext['map'] = shallowReactive(new Map())

  return {
    get current() {
      return +current.value
    },
    set current(value) {
      current.value = +value
    },
    relativeOffsets,
    map,
    onMounted() { },
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

export function createFixedClicks(
  route?: SlideRoute | undefined,
  currentInit = 0,
): ClicksContext {
  return createClicksContextBase(ref(currentInit), route?.meta?.clicks)
}
