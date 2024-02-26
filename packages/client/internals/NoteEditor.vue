<script setup lang="ts">
import type { PropType } from 'vue'
import { nextTick, ref, watch, watchEffect } from 'vue'
import { ignorableWatch, onClickOutside, useVModel } from '@vueuse/core'
import type { ClicksContext } from '@slidev/types'
import { useDynamicSlideInfo } from '../logic/note'
import NoteDisplay from './NoteDisplay.vue'

const props = defineProps({
  no: {
    type: Number,
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

const emit = defineEmits([
  'update:editing',
])
const editing = useVModel(props, 'editing', emit, { passive: true })

const { info, update } = useDynamicSlideInfo(props.no)

const note = ref('')
let timer: any

const { ignoreUpdates } = ignorableWatch(
  note,
  (v) => {
    const id = props.no
    clearTimeout(timer)
    timer = setTimeout(() => {
      update({ note: v }, id)
    }, 500)
  },
)

watch(
  info,
  (v) => {
    if (editing.value)
      return
    clearTimeout(timer)
    ignoreUpdates(() => {
      note.value = v?.note || ''
    })
  },
  { immediate: true, flush: 'sync' },
)

const input = ref<HTMLTextAreaElement>()

watchEffect(() => {
  if (editing.value)
    input.value?.focus()
})

onClickOutside(input, () => {
  editing.value = false
})

function calculateHeight() {
  if (!props.autoHeight || !input.value || !editing.value)
    return
  if (input.value.scrollHeight > input.value.clientHeight)
    input.value.style.height = `${input.value.scrollHeight}px`
}

const inputHeight = ref<number | null>()

watch(
  note,
  () => {
    nextTick(() => {
      calculateHeight()
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
  />
  <textarea
    v-else
    ref="input"
    v-model="note"
    class="prose resize-none overflow-auto outline-none bg-transparent block border-primary border-2"
    style="line-height: 1.75;"
    :style="[props.style, inputHeight != null ? { height: `${inputHeight}px` } : {}]"
    :class="props.class"
    :placeholder="placeholder"
    @keydown.esc="editing = false"
  />
</template>
