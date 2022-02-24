<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { go, total } from '../logic/nav'
import { showGotoDialog } from '../state'

const input = ref<HTMLInputElement>()
const text = ref('')
const num = computed(() => +text.value)
const valid = computed(() => !isNaN(num.value) && num.value > 0 && num.value <= total.value)

function goTo() {
  if (valid.value)
    go(num.value)
  close()
}

function close() {
  showGotoDialog.value = false
}

watch(showGotoDialog, async(show) => {
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
  if (t.match(/^[^0-9]/))
    text.value = text.value.substr(1)
})
</script>

<template>
  <div
    id="slidev-goto-dialog"
    class="fixed right-5 bg-main transform transition-all"
    :class="showGotoDialog ? 'top-5' : '-top-20'"
    shadow="~"
    p="x-4 y-2"
    border="~ transparent rounded dark:(gray-400 opacity-25)"
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
