import type { Ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { computed, onScopeDispose, watch } from 'vue'
import { hideCursorIdle } from '../state'

const TIMEOUT = 2000

export function useHideCursorIdle(
  enabled: Ref<boolean>,
) {
  const shouldHide = computed(() => enabled.value && hideCursorIdle.value)

  function hide() {
    document.body.style.cursor = 'none'
  }
  function show() {
    document.body.style.cursor = ''
  }

  let timer: ReturnType<typeof setTimeout> | null = null

  // If disabled, immediately show the cursor and stop the timer
  watch(
    shouldHide,
    (value) => {
      if (!value) {
        show()
        if (timer) {
          clearTimeout(timer)
        }
        timer = null
      }
    },
  )

  onScopeDispose(() => {
    show()
    if (timer) {
      clearTimeout(timer)
    }
    timer = null
  })

  useEventListener(
    document.body,
    ['pointermove', 'pointerdown'],
    () => {
      show()
      if (timer)
        clearTimeout(timer)
      if (shouldHide.value) {
        timer = setTimeout(hide, TIMEOUT)
      }
      else {
        timer = null
      }
    },
    { passive: true },
  )
}
