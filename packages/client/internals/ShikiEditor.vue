<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { useIME } from '../composables/useIME'

const props = defineProps<{
  placeholder?: string
}>()
const content = defineModel<string>({ required: true })
const { composingContent, onInput, onCompositionEnd } = useIME(content)

const textareaEl = ref<HTMLTextAreaElement | null>(null)

const highlight = shallowRef<((code: string) => string) | null>(null)
import('../setup/shiki').then(async (m) => {
  const { getEagerHighlighter, defaultHighlightOptions } = await m.default()
  const highlighter = await getEagerHighlighter()
  highlight.value = (code: string) => highlighter.codeToHtml(code, {
    ...defaultHighlightOptions,
    lang: 'markdown',
  })
})
</script>

<template>
  <div class="absolute left-3 right-0 inset-y-2 font-mono overflow-x-hidden overflow-y-auto cursor-text">
    <div v-if="highlight" class="relative w-full h-max min-h-full">
      <div class="relative w-full h-max" v-html="`${highlight(composingContent)}&nbsp;`" />
      <textarea
        ref="textareaEl" v-model="composingContent" :placeholder="props.placeholder"
        class="absolute inset-0 resize-none text-transparent bg-transparent focus:outline-none caret-black dark:caret-white overflow-y-hidden"
        @input="onInput"
        @compositionend="onCompositionEnd"
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
  word-break: normal;
  overflow-wrap: break-word;
  display: block;
  width: 100%;
}
:deep(pre.shiki) {
  background-color: transparent;
}
</style>
