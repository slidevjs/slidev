import type { Ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { computed } from 'vue'
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

  useEventListener(
    document.body,
    ['pointermove', 'pointerdown'],
    () => {
      show()
      if (!shouldHide.value)
        return
      if (timer)
        clearTimeout(timer)
      timer = setTimeout(hide, TIMEOUT)
    },
    { passive: true },
  )
}
