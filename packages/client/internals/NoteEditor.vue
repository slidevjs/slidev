<script setup lang="ts">
import { ignorableWatch, onClickOutside } from '@vueuse/core'
import { nextTick, ref, watch } from 'vue'
import { currentSlideId } from '../logic/nav'
import { useDynamicSlideInfo } from '../logic/note'
import NoteDisplay from './NoteDisplay.vue'

const props = defineProps({
  class: {
    default: '',
  },
  style: {
    default: () => ({}),
  },
  placeholder: {
    default: 'No notes for this slide',
  },
})

const { info, update } = useDynamicSlideInfo(currentSlideId)

const note = ref('')
let timer: any

const { ignoreUpdates } = ignorableWatch(
  note,
  (v) => {
    const id = currentSlideId.value
    clearTimeout(timer)
    timer = setTimeout(() => {
      update({ raw: null!, note: v }, id)
    }, 500)
  },
)

watch(
  info,
  (v) => {
    clearTimeout(timer)
    ignoreUpdates(() => {
      note.value = v?.note || ''
    })
  },
  { immediate: true, flush: 'sync' },
)

const input = ref<HTMLTextAreaElement>()
const editing = ref(false)

async function switchNoteEdit(e: MouseEvent) {
  if ((e?.target as HTMLElement)?.tagName === 'A')
    return

  editing.value = true
  input.value?.focus()
  await nextTick()
  input.value?.focus()
}

onClickOutside(input, () => {
  editing.value = false
})
</script>

<template>
  <NoteDisplay
    v-if="!editing && note"
    class="my--4 border-transparent border-2"
    :class="props.class"
    :style="props.style"
    :note="note"
    :note-html="info?.noteHTML"
    @click="switchNoteEdit"
  />
  <textarea
    v-else
    ref="input"
    v-model="note"
    class="prose resize-none overflow-auto outline-none bg-transparent block border-green border-2"
    style="line-height: 1.75;"
    :style="props.style"
    :class="props.class"
    :placeholder="placeholder"
    @keydown.esc=" editing = false"
    @focus="editing = true"
  />
</template>
