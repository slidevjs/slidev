import type { ModelRef } from 'vue'
import { ref, watch } from 'vue'

export function useIME(content: ModelRef<string>) {
  const composingContent = ref(content.value)
  watch(content, (v) => {
    if (v !== composingContent.value) {
      composingContent.value = v
    }
  })

  function onInput(e: Event) {
    if (!(e instanceof InputEvent) || !(e.target instanceof HTMLTextAreaElement)) {
      return
    }

    if (e.isComposing) {
      composingContent.value = e.target.value
    }
    else {
      content.value = e.target.value
    }
  }

  function onCompositionEnd() {
    content.value = composingContent.value
  }

  return { composingContent, onInput, onCompositionEnd }
}
