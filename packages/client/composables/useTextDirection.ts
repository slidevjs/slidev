import type { Ref } from 'vue'
import { watch } from 'vue'

// Handle keyboard shortcuts for switching text direction
// Mainly for RTL documents where you need to quickly switch between RTL and LTR
export function useTextDirection(element: Ref<HTMLTextAreaElement | null | undefined>) {
  function handleKeyDown(e: KeyboardEvent) {
    // Check if it's a Ctrl+Shift combo
    if (!e.ctrlKey || !e.shiftKey || e.key !== 'Shift')
      return

    // The KeyboardEvent.location property tells us which shift key was pressed
    // 1 = left shift, 2 = right shift
    if (e.location === 1) {
      // Left shift = LTR
      e.preventDefault()
      if (element.value)
        element.value.setAttribute('dir', 'ltr')
    }
    else if (e.location === 2) {
      // Right shift = RTL
      e.preventDefault()
      if (element.value)
        element.value.setAttribute('dir', 'rtl')
    }
  }

  // Need to watch the element because it might not be available immediately
  watch(element, (newEl, oldEl) => {
    if (oldEl)
      oldEl.removeEventListener('keydown', handleKeyDown)

    if (newEl)
      newEl.addEventListener('keydown', handleKeyDown)
  }, { immediate: true })
}
