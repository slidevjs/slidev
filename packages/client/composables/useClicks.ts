import type { ClicksContext, NormalizedRangeClickValue, NormalizedSingleClickValue, RawAtValue, RawSingleAtValue, SlideRoute } from '@slidev/types'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { clamp, sum } from '@antfu/utils'
import { computed, isReadonly, onMounted, onUnmounted, ref, shallowReactive, toValue, watch } from 'vue'

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
  if (v <= 0) {
    console.warn(`[Slidev] "at" prop value must be greater than 0, but got ${at}, has been set to 1`)
    return 1
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
  const isMounted = ref(false)
  let relativeSizeMap: ClicksContext['relativeSizeMap'] = new Map()
  let maxMap: ClicksContext['maxMap'] = new Map()
  const context: ClicksContext = {
    get current() {
      return clamp(+current.value, clicksStart, context.total)
    },
    set current(value) {
      current.value = isMounted.value
        ? clamp(value, clicksStart, context.total)
        : value /* context.total is not available yet */
    },
    clicksStart,
    get relativeSizeMap() {
      if (__DEV__ && isMounted.value)
        console.warn('[slidev] ClicksContext: Unexpected access to relativeSizeMap after mounted')
      return relativeSizeMap
    },
    get maxMap() {
      return maxMap
    },
    get isMounted() {
      return isMounted.value
    },
    setup() {
      onMounted(() => {
        isMounted.value = true
        // Convert maxMap to reactive
        maxMap = shallowReactive(maxMap)
        // Make sure the query is not greater than the total
        if (!isReadonly(current))
          context.current = current.value
      })
      onUnmounted(() => {
        isMounted.value = false
        relativeSizeMap = new Map()
        maxMap = new Map()
      })
    },
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
      if (__DEV__ && isMounted.value)
        console.warn('[slidev] ClicksContext: Unexpected register after mounted')
      const { delta, max } = info
      relativeSizeMap.set(el, delta)
      maxMap.set(el, max)
    },
    unregister(el) {
      relativeSizeMap.delete(el)
      maxMap.delete(el)
    },
    get currentOffset() {
      return sum(...relativeSizeMap.values())
    },
    get total() {
      return clicksTotalOverrides
        ?? (isMounted.value
          ? Math.max(0, ...maxMap.values())
          : 0 /* fallback value */
        )
    },
  }
  return context
}

export function createFixedClicks(
  route?: SlideRoute | undefined,
  currentInit: MaybeRefOrGetter<number> = 0,
): ClicksContext {
  const clicksStart = route?.meta.slide?.frontmatter.clicksStart ?? 0
  const clicks = ref(Math.max(toValue(currentInit), clicksStart))
  watch(() => toValue(currentInit), (v) => {
    clicks.value = Math.max(v, clicksStart)
  })
  return createClicksContextBase(
    clicks,
    clicksStart,
    route?.meta?.clicks,
  )
}
