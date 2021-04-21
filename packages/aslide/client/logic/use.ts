import { useEventListener } from '@vueuse/core'
import { ref, computed } from 'vue'

// candidates for VueUse

export function useActiveElement() {
  const counter = ref(0)
  useEventListener('blur', () => counter.value += 1, true)
  useEventListener('focus', () => counter.value += 1, true)
  return computed(() => {
    // eslint-disable-next-line no-unused-expressions
    counter.value
    return document.activeElement
  })
}
