<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { go, rawRoutes, total } from '../logic/nav'
import { showGotoDialog } from '../state'

const input = ref<HTMLInputElement>()
const text = ref('')

const valid = computed(() => {
  if (text.value.startsWith('/')) {
    return !!rawRoutes.find(r => r.path === text.value.substring(1))
  }
  else {
    const num = +text.value
    return !isNaN(num) && num > 0 && num <= total.value
  }
})

function goTo() {
  if (valid.value) {
    if (text.value.startsWith('/'))
      go(text.value.substring(1))

    else
      go(+text.value)
  }
  close()
}

function close() {
  showGotoDialog.value = false
}

watch(showGotoDialog, async (show) => {
  if (show) {
    await nextTick()
    text.value = ''
    input.value?.focus()
  }
  else {
    input.value?.blur()
  }
})

// remove the g character coming from the key that triggered showGotoDialog (e.g. in Firefox)
watch(text, (t) => {
  if (t.match(/^[^0-9/]/))
    text.value = text.value.substring(1)
})
</script>

<template>
  <div
    id="slidev-goto-dialog"
    class="fixed right-5 bg-main transform transition-all"
    :class="showGotoDialog ? 'top-5' : '-top-20'"
    shadow="~"
    p="x-4 y-2"
    border="~ transparent rounded dark:gray-400 dark:opacity-25"
  >
    <input
      ref="input"
      v-model="text"
      type="text"
      :disabled="!showGotoDialog"
      class="outline-none bg-transparent"
      placeholder="Goto..."
      :class="{ 'text-red-400': !valid && text }"
      @keydown.enter="goTo"
      @keydown.escape="close"
      @blur="close"
    >
  </div>
</template>
