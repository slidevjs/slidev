<script setup lang="ts">
import { getHighlighter } from '#slidev/shiki'
import { ref, shallowRef, watch } from 'vue'

const props = defineProps<{
  placeholder?: string
}>()
const content = defineModel<string>({ required: true })

const textareaEl = ref<HTMLTextAreaElement | null>(null)

const highlight = shallowRef<Awaited<ReturnType<typeof getHighlighter>> | null>(null)
getHighlighter().then(h => highlight.value = h)

const localContent = ref(content.value)
const composing = ref(false)

watch(content, (v) => {
  if (v !== localContent.value && !composing.value) {
    localContent.value = v
  }
})

let preText = ''
let postText = ''

function onCompositionStart() {
  composing.value = true
  if (textareaEl.value) {
    const start = textareaEl.value.selectionStart
    const end = textareaEl.value.selectionEnd
    preText = textareaEl.value.value.slice(0, start)
    postText = textareaEl.value.value.slice(end)
  }
}

function onCompositionUpdate(e: CompositionEvent) {
  if (composing.value) {
    localContent.value = preText + e.data + postText
    e.preventDefault()
  }
}

function onCompositionEnd() {
  composing.value = false
  preText = ''
  postText = ''
  // apply composition result
  content.value = localContent.value
}

function onInput(e: Event) {
  if (!composing.value) {
    content.value = (e.target as HTMLTextAreaElement).value
  }
}
</script>

<template>
  <div class="absolute left-3 right-0 inset-y-2 font-mono overflow-x-hidden overflow-y-auto cursor-text">
    <div v-if="highlight" class="relative w-full h-max min-h-full">
      <div class="relative w-full h-max" v-html="`${highlight(localContent, 'markdown')}&nbsp;`" />
      <textarea
        ref="textareaEl" v-model="localContent" :placeholder="props.placeholder"
        class="absolute inset-0 resize-none text-transparent bg-transparent focus:outline-none caret-black dark:caret-white overflow-y-hidden"
        @compositionstart="onCompositionStart"
        @compositionupdate="onCompositionUpdate"
        @compositionend="onCompositionEnd"
        @input="onInput"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(code),
textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-feature-settings: normal;
  font-variation-settings: normal;
  font-size: 1em;
  text-wrap: wrap;
  word-break: break-all;
  display: block;
  width: 100%;
}
:deep(pre.shiki) {
  background-color: transparent;
}
</style>
