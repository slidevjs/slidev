import { clamp, sum } from '@antfu/utils'
import type { ClicksContext, SlideRoute } from '@slidev/types'
import type { Ref } from 'vue'
import { ref, shallowReactive } from 'vue'
import { normalizeAtProp } from '../logic/utils'
import { routeForceRefresh } from '../logic/route'

export function createClicksContextBase(
  current: Ref<number>,
  clicksStart = 0,
  clicksTotalOverrides?: number,
): ClicksContext {
  const relativeOffsets: ClicksContext['relativeOffsets'] = new Map()
  const map: ClicksContext['map'] = shallowReactive(new Map())

  return {
    get current() {
      // Here we haven't know clicksTotal yet.
      return clamp(+current.value, clicksStart, this.total)
    },
    set current(value) {
      current.value = clamp(+value, clicksStart, this.total)
    },
    clicksStart,
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
      return clicksTotalOverrides ?? Math.max(0, ...[...map.values()].map(v => v.max || 0))
    },
  }
}

export function createFixedClicks(
  route?: SlideRoute | undefined,
  currentInit = 0,
): ClicksContext {
  const clicksStart = route?.meta.slide?.frontmatter.clicksStart ?? 0
  return createClicksContextBase(
    ref(Math.max(currentInit, clicksStart)),
    clicksStart,
    route?.meta?.clicks,
  )
}
