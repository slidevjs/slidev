<script setup lang="ts">
import type { PropType } from 'vue'
import { nextTick, ref, toRef, watch, watchEffect } from 'vue'
import { ignorableWatch, onClickOutside, useVModel } from '@vueuse/core'
import type { ClicksContext } from '@slidev/types'
import { useDynamicSlideInfo } from '../composables/useSlideInfo'
import NoteDisplay from './NoteDisplay.vue'

const props = defineProps({
  no: {
    type: Number,
    required: true,
  },
  class: {
    default: '',
  },
  editing: {
    default: false,
  },
  style: {
    default: () => ({}),
  },
  placeholder: {
    default: 'No notes for this slide',
  },
  clicksContext: {
    type: Object as PropType<ClicksContext>,
  },
  autoHeight: {
    default: false,
  },
})

const emit = defineEmits<{
  (type: 'update:editing', value: boolean): void
  (type: 'markerDblclick', e: MouseEvent, clicks: number): void
  (type: 'markerClick', e: MouseEvent, clicks: number): void
}>()

const editing = useVModel(props, 'editing', emit, { passive: true })

const { info, update } = useDynamicSlideInfo(toRef(props, 'no'))

const note = ref('')
let timer: any

// Send back the note on changes
const { ignoreUpdates } = ignorableWatch(
  note,
  (v) => {
    if (!editing.value)
      return
    const id = props.no
    clearTimeout(timer)
    timer = setTimeout(() => {
      update({ note: v }, id)
    }, 500)
  },
)

// Update note value when info changes
watch(
  () => info.value?.note,
  (value = '') => {
    if (editing.value)
      return
    clearTimeout(timer)
    ignoreUpdates(() => {
      note.value = value
    })
  },
  { immediate: true, flush: 'sync' },
)

const inputEl = ref<HTMLTextAreaElement>()
const inputHeight = ref<number | null>()

watchEffect(() => {
  if (editing.value)
    inputEl.value?.focus()
})

onClickOutside(inputEl, () => {
  editing.value = false
})

function calculateEditorHeight() {
  if (!props.autoHeight || !inputEl.value || !editing.value)
    return
  if (inputEl.value.scrollHeight > inputEl.value.clientHeight)
    inputEl.value.style.height = `${inputEl.value.scrollHeight}px`
}

watch(
  [note, editing],
  () => {
    nextTick(() => {
      calculateEditorHeight()
    })
  },
  { flush: 'post', immediate: true },
)
</script>

<template>
  <NoteDisplay
    v-if="!editing"
    class="border-transparent border-2"
    :class="[props.class, note ? '' : 'opacity-25 italic select-none']"
    :style="props.style"
    :note="note || placeholder"
    :note-html="info?.noteHTML"
    :clicks-context="clicksContext"
    :auto-scroll="!autoHeight"
    @marker-click="(e, clicks) => emit('markerClick', e, clicks)"
    @marker-dblclick="(e, clicks) => emit('markerDblclick', e, clicks)"
  />
  <textarea
    v-else
    ref="inputEl"
    v-model="note"
    class="prose resize-none overflow-auto outline-none bg-transparent block border-primary border-2"
    style="line-height: 1.75;"
    :style="[props.style, inputHeight != null ? { height: `${inputHeight}px` } : {}]"
    :class="props.class"
    :placeholder="placeholder"
    @keydown.esc="editing = false"
  />
</template>
