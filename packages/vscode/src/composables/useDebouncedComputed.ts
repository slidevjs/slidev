import { computed, shallowRef, watch } from 'reactive-vscode'

export function useDebouncedComputed<T>(source: () => T, delay: (newVal: T, oldVal: T) => number | null) {
  const result = shallowRef(source())
  let timeout: any
  watch(
    source,
    (newVal, oldVal) => {
      clearTimeout(timeout)
      const d = delay(newVal, oldVal)
      if (d == null) {
        result.value = newVal
      }
      else {
        timeout = setTimeout(() => {
          result.value = newVal
        }, d)
      }
    },
  )
  return computed<T>(() => result.value)
}
