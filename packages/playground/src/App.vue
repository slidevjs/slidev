<script setup lang="ts">
import { computed, ref } from 'vue'
import { renderMarkdown, shikiReady } from './renderer'

const SLIDE_SEPARATOR = /\n---\n/

const input = ref(`# Hello Slidev

---

## Code Example

\`\`\`typescript
const greeting: string = 'Hello, World!'
console.log(greeting)
\`\`\`

---

## Thank You
`)

const renderedSlides = computed(() => {
  // Track shikiReady so slides re-render when shiki loads
  void shikiReady.value
  return input.value
    .split(SLIDE_SEPARATOR)
    .map(slide => renderMarkdown(slide.trim()))
})
</script>

<template>
  <div class="playground">
    <div class="editor">
      <textarea v-model="input" spellcheck="false" />
    </div>
    <div class="preview">
      <div
        v-for="(html, index) in renderedSlides"
        :key="index"
        class="slide"
        v-html="html"
      />
    </div>
  </div>
</template>

<style>
.playground {
  display: flex;
  height: 100vh;
  font-family: system-ui, sans-serif;
}

.editor {
  flex: 1;
  display: flex;
}

.editor textarea {
  width: 100%;
  padding: 1rem;
  font-family: monospace;
  font-size: 14px;
  border: none;
  outline: none;
  resize: none;
  background: #1e1e1e;
  color: #d4d4d4;
}

.preview {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #fff;
}

.slide {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 1rem;
  min-height: 200px;
}

.slidev-heading {
  margin-top: 0;
}
</style>
