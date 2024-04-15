<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Fuse from 'fuse.js'
import { activeElement, showGotoDialog } from '../state'
import { useNav } from '../composables/useNav'
import TitleRenderer from '#slidev/title-renderer'

const container = ref<HTMLDivElement>()
const input = ref<HTMLInputElement>()
const list = ref<HTMLUListElement>()
const items = ref<HTMLLIElement[]>()
const text = ref('')
const selectedIndex = ref(0)

const { go, slides } = useNav()

function notNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

const fuse = computed(() => new Fuse(slides.value.map(i => i.meta?.slide).filter(notNull), {
  keys: ['no', 'title'],
  threshold: 0.3,
  shouldSort: true,
  minMatchCharLength: 1,
}))

const path = computed(() => text.value.startsWith('/') ? text.value.substring(1) : text.value)
const result = computed(() => fuse.value.search(path.value).map(result => result.item))
const valid = computed(() => !!result.value.length)

function goTo() {
  if (valid.value) {
    const item = result.value.at(selectedIndex.value || 0)
    if (item)
      go(item.no)
  }
  close()
}

function close() {
  text.value = ''
  showGotoDialog.value = false
}

function focusDown(event: Event) {
  event.preventDefault()
  selectedIndex.value++
  if (selectedIndex.value >= result.value.length)
    selectedIndex.value = 0
  scroll()
}

function focusUp(event: Event) {
  event.preventDefault()
  selectedIndex.value--
  if (selectedIndex.value <= -2)
    selectedIndex.value = result.value.length - 1
  scroll()
}

function scroll() {
  const item = items.value?.[selectedIndex.value]
  if (item && list.value) {
    if (item.offsetTop + item.offsetHeight > list.value.offsetHeight + list.value.scrollTop) {
      list.value.scrollTo({
        behavior: 'smooth',
        top: item.offsetTop + item.offsetHeight - list.value.offsetHeight + 1,
      })
    }
    else if (item.offsetTop < list.value.scrollTop) {
      list.value.scrollTo({
        behavior: 'smooth',
        top: item.offsetTop,
      })
    }
  }
}

function updateText(event: Event) {
  selectedIndex.value = 0
  text.value = (event.target as HTMLInputElement).value
}

function select(no: number) {
  go(no)
  close()
}

watch(showGotoDialog, async (show) => {
  if (show) {
    text.value = ''
    selectedIndex.value = 0
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
    w-90 max-w-90 min-w-90
    :class="showGotoDialog ? 'top-5' : '-top-20'"
  >
    <div
      class="bg-main transform"
      shadow="~"
      p="x-4 y-2"
      border="~ transparent rounded dark:main"
    >
      <input
        id="slidev-goto-input"
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
      v-if="result.length > 0"
      ref="list"
      class="autocomplete-list"
      shadow="~"
      border="~ transparent rounded dark:main"
    >
      <li
        v-for="(item, index) of result"
        ref="items"
        :key="item.id"
        role="button"
        tabindex="0"
        p="x-4 y-2"
        cursor-pointer
        hover="op100"
        flex="~ gap-2"
        w-90
        items-center
        :border="index === 0 ? '' : 't main'"
        :class="selectedIndex === index ? 'bg-active op100' : 'op80'"
        @click.stop.prevent="select(item.no)"
      >
        <div w-4 text-right op50 text-sm>
          {{ item.no }}
        </div>
        <TitleRenderer :no="item.no" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.autocomplete-list {
  --uno: bg-main mt-1;
  overflow: auto;
  max-height: calc(100vh - 100px);
}

.autocomplete {
  cursor: pointer;
}
</style>
