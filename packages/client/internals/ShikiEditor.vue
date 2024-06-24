<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { getHighlighter } from '#slidev/shiki'

const props = defineProps<{
  placeholder?: string
}>()
const content = defineModel<string>({ required: true })

const textareaEl = ref<HTMLTextAreaElement | null>(null)

const html = ref('')

watchEffect((onCleanup) => {
  let canceled = false
  onCleanup(() => canceled = true)

  const c = content.value
  async function updateHtml() {
    const highlight = await getHighlighter()
    if (canceled)
      return
    const h = await highlight(c, 'markdown')
    if (canceled)
      return
    html.value = h
  }
  updateHtml()
})
</script>

<template>
  <div class="absolute inset-0 font-mono overflow-x-hidden overflow-y-auto">
    <div class="relative w-full h-max">
      <div class="relative w-full h-max" v-html="html" />
      <textarea
        ref="textareaEl" v-model="content" :placeholder="props.placeholder"
        class="absolute inset-0 resize-none text-transparent bg-transparent focus:outline-none caret-white overflow-y-hidden"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(code),
textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-feature-settings: normal;
  font-variation-settings: normal;
  font-size: 1em;
  text-wrap: wrap;
  word-break: break-all;
  display: block;
  width: 100%;
}
</style>
