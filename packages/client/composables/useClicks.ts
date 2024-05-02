import { clamp, sum } from '@antfu/utils'
import type { ClicksContext, NormalizedRangeClickValue, NormalizedSingleClickValue, RawAtValue, RawSingleAtValue, SlideRoute } from '@slidev/types'
import type { Ref } from 'vue'
import { computed, ref, shallowReactive } from 'vue'
import { routeForceRefresh } from '../logic/route'

export function normalizeSingleAtValue(at: RawSingleAtValue): NormalizedSingleClickValue {
  if (at === false || at === 'false')
    return null
  if (at == null || at === true || at === 'true')
    return '+1'
  if (typeof at === 'string' && '+-'.includes(at[0]))
    return at
  const v = +at
  if (Number.isNaN(v)) {
    console.error(`Invalid "at" prop value: ${at}`)
    return null
  }
  return v
}

export function normalizeRangeAtValue(at: RawAtValue): NormalizedRangeClickValue {
  if (Array.isArray(at))
    return [normalizeSingleAtValue(at[0])!, normalizeSingleAtValue(at[1])!]
  return null
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
    calculateSince(rawAt, size = 1) {
      const at = normalizeSingleAtValue(rawAt)
      if (at == null)
        return null
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
        currentOffset: computed(() => context.current - start),
        isCurrent: computed(() => context.current === start),
        isActive: computed(() => context.current >= start),
      }
    },
    calculateRange(rawAt) {
      const at = normalizeRangeAtValue(rawAt)
      if (at == null)
        return null
      const [a, b] = at
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
        currentOffset: computed(() => context.current - start),
        isCurrent: computed(() => context.current === start),
        isActive: computed(() => start <= context.current && context.current < end),
      }
    },
    calculate(at) {
      if (Array.isArray(at))
        return context.calculateRange(at)
      return context.calculateSince(at)
    },
    register(el, info) {
      if (!info)
        return
      const { delta, max } = info
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
