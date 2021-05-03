<script setup lang="ts">
import { whenever } from '@vueuse/core'
import { nextTick, ref } from 'vue'
import { go } from '../logic/nav'
import { showGotoDialog } from '../state'

const input = ref<HTMLInputElement>()
const num = ref('')

function goTo() {
  const n = +num.value
  if (!isNaN(n))
    go(n - 1)
  close()
}

function close() {
  showGotoDialog.value = false
}

whenever(showGotoDialog, async() => {
  num.value = ''
  await nextTick()
  input.value?.focus()
})
</script>

<template>
  <div
    class="fixed right-5 bg-main transform transition-all"
    :class="showGotoDialog ? 'top-5' : '-top-20'"
    shadow="~"
    p="x-4 y-2"
    border="~ transparent rounded dark:(gray-400 opacity-25)"
  >
    <input
      ref="input"
      v-model="num"
      type="number"
      :disabled="!showGotoDialog"
      class="outline-none bg-transparent"
      placeholder="Goto..."
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
