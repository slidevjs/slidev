<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { aliases, availablePaths, go } from '../logic/nav'
import { showGotoDialog } from '../state'

const input = ref<HTMLInputElement>()
const text = ref('')

const valid = computed(() => isValid(false))

function isValid(strict: boolean): boolean {
  let path = text.value
  if (text.value.startsWith('/'))
    path = text.value.substring(1)
  if (strict)
    return availablePaths.value.includes(path)
  else
    return availablePaths.value.some(availablePath => availablePath.startsWith(path))
}

function goTo() {
  if (isValid(true)) {
    let path = text.value
    if (text.value.startsWith('/'))
      path = text.value.substring(1)
    if (aliases.value.has(path))
      go(+aliases.value.get(path)!)
    else
      go(+path)
  }
  close()
}

function close() {
  showGotoDialog.value = false
}

watch(showGotoDialog, async (show) => {
  if (show) {
    text.value = ''
    // delay the focus to avoid the g character coming from the key that triggered showGotoDialog
    setTimeout(() => input.value?.focus(), 0)
  }
  else {
    input.value?.blur()
  }
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
