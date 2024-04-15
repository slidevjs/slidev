import { clamp, sum } from '@antfu/utils'
import type { ClicksContext, NormalizedAtValue, RawAtValue, SlideRoute } from '@slidev/types'
import type { Ref } from 'vue'
import { computed, ref, shallowReactive } from 'vue'
import { routeForceRefresh } from '../logic/route'

export function normalizeAtValue(at: RawAtValue): NormalizedAtValue {
  if (at === false || at === 'false')
    return null
  if (at == null || at === true || at === 'true')
    return '+1'
  if (Array.isArray(at))
    return [+at[0], +at[1]]
  if (typeof at === 'string' && '+-'.includes(at[0]))
    return at
  return +at
}

export function createClicksContextBase(
  current: Ref<number>,
  clicksStart = 0,
  clicksTotalOverrides?: number,
): ClicksContext {
  const context: ClicksContext = {
    get current() {
      // Here we haven't know clicksTotal yet.
      return clamp(+current.value, clicksStart, context.total)
    },
    set current(value) {
      current.value = clamp(+value, clicksStart, context.total)
    },
    clicksStart,
    relativeOffsets: new Map(),
    maxMap: shallowReactive(new Map()),
    onMounted() { },
    calculateSince(at, size = 1) {
      let start: number, max: number, delta: number
      if (typeof at === 'string') {
        const offset = context.currentOffset
        const value = +at
        start = offset + value
        max = offset + value + size - 1
        delta = value + size - 1
      }
      else {
        start = at
        max = at + size - 1
        delta = 0
      }
      return {
        start,
        end: +Number.POSITIVE_INFINITY,
        max,
        delta,
        isCurrent: computed(() => context.current === start),
        isActive: computed(() => context.current >= start),
      }
    },
    calculateRange([a, b]) {
      let start: number, end: number, delta: number
      if (typeof a === 'string') {
        const offset = context.currentOffset
        start = offset + +a
        delta = +a
      }
      else {
        start = a
        delta = 0
      }
      if (typeof b === 'string') {
        end = start + +b
        delta += +b
      }
      else {
        end = b
      }
      return {
        start,
        end,
        max: end,
        delta,
        isCurrent: computed(() => context.current === start),
        isActive: computed(() => start <= context.current && context.current < end),
      }
    },
    calculate(at) {
      if (at == null)
        return null
      if (Array.isArray(at))
        return context.calculateRange(at)
      return context.calculateSince(at)
    },
    register(el, { delta, max }) {
      context.relativeOffsets.set(el, delta)
      context.maxMap.set(el, max)
    },
    unregister(el) {
      context.relativeOffsets.delete(el)
      context.maxMap.delete(el)
    },
    get currentOffset() {
      // eslint-disable-next-line no-unused-expressions
      routeForceRefresh.value
      return sum(...context.relativeOffsets.values())
    },
    get total() {
      // eslint-disable-next-line no-unused-expressions
      routeForceRefresh.value
      return clicksTotalOverrides ?? Math.max(0, ...context.maxMap.values())
    },
  }
  return context
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
