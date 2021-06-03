<script setup lang="ts">
import { whenever } from '@vueuse/core'
import { computed, nextTick, ref } from 'vue'
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

whenever(showGotoDialog, async() => {
  text.value = ''
  await nextTick()
  input.value?.focus()
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
      type="number"
      :disabled="!showGotoDialog"
      class="outline-none bg-transparent"
      placeholder="Goto..."
      :class="{ 'text-red-400': !valid && text }"
      @keydown.enter="goTo"
      @keydown.escape="close"
      @blur="close"
    />
  </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
