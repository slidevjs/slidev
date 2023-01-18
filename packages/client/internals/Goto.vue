<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { aliases, availablePaths, go } from '../logic/nav'
import { activeElement, showGotoDialog } from '../state'

const container = ref<HTMLDivElement>()
const input = ref<HTMLInputElement>()
const text = ref('')
const selectedItem = ref(-1)

const path = computed(() => text.value.startsWith('/') ? text.value.substring(1) : text.value)
const valid = computed(() => isValid(false))
const autocompleteList = computed(() => [...aliases.value.keys()])
const autocomplete = computed(() => autocompleteList.value
  .filter(item => path.value !== '' && item.toLowerCase().startsWith(path.value.toLowerCase())))

function isValid(strict: boolean): boolean {
  if (strict)
    return availablePaths.value.includes(path.value)
  else
    return availablePaths.value.some(availablePath => availablePath.toLowerCase().startsWith(path.value.toLowerCase()))
}

function goTo() {
  if (selectedItem.value >= 0 && selectedItem.value < autocomplete.value.length)
    text.value = autocomplete.value.at(selectedItem.value)
  if (isValid(true)) {
    if (aliases.value.has(path.value))
      go(+aliases.value.get(path.value)!)
    else
      go(+path.value)
  }
  close()
}

function close() {
  text.value = ''
  showGotoDialog.value = false
}

function focusDown(event: Event) {
  if (autocomplete.value.length > 0)
    event.preventDefault()
  selectedItem.value++
  if (selectedItem.value >= autocomplete.value.length)
    selectedItem.value = -1
}

function focusUp(event: Event) {
  if (autocomplete.value.length > 0)
    event.preventDefault()
  selectedItem.value--
  if (selectedItem.value <= -2)
    selectedItem.value = autocomplete.value.length - 1
}

function updateText(event: Event) {
  selectedItem.value = -1
  text.value = (event.target as HTMLInputElement).value
}

function select(item: string) {
  go(+aliases.value.get(item)!)
  close()
}

watch(showGotoDialog, async (show) => {
  if (show) {
    text.value = ''
    selectedItem.value = -1
    // delay the focus to avoid the g character coming from the key that triggered showGotoDialog
    setTimeout(() => input.value?.focus(), 0)
  }
  else {
    input.value?.blur()
  }
})

watch(activeElement, () => {
  if (!container.value?.contains(activeElement.value as Node))
    close()
})
</script>

<template>
  <div
    id="slidev-goto-dialog"
    ref="container"
    class="fixed right-5 transition-all"
    :class="showGotoDialog ? 'top-5' : '-top-20'"
  >
    <div
      class="bg-main transform"
      shadow="~"
      p="x-4 y-2"
      border="~ transparent rounded dark:gray-400 dark:opacity-25"
    >
      <input
        ref="input"
        :value="text"
        type="text"
        :disabled="!showGotoDialog"
        class="outline-none bg-transparent"
        placeholder="Goto..."
        :class="{ 'text-red-400': !valid && text }"
        @keydown.enter="goTo"
        @keydown.escape="close"
        @keydown.down="focusDown"
        @keydown.up="focusUp"
        @input="updateText"
      >
    </div>
    <ul
      v-if="autocomplete.length > 0"
      class="bg-main transform mt-1"
      shadow="~"
      p="x-4 y-2"
      border="~ transparent rounded dark:gray-400 dark:opacity-25"
    >
      <li
        v-for="(item, index) of autocomplete"
        :key="item" class="autocomplete"
        :class="{ selected: selectedItem === index }"
        role="button"
        tabindex="0"
        @click.stop="select(item)"
      >
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<style scoped lang="postcss">
.autocomplete {
  cursor: pointer;

  &:hover {
    text-decoration: underline
  }
}

.selected {
  position: relative;

  &::before {
    @apply rounded;
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -0.25em;
    right: -0.25em;
    background-color: var(--slidev-theme-primary);
    opacity: 0.5;
    z-index: -1;
  }
}
</style>
