<script setup lang="ts">
import { ref } from 'vue'
import CodeMirrorEditor from './components/CodeMirrorEditor.vue'

const markdown = ref(`# Welcome to Slidev Playground

Type your slides here...

---

# Slide 2

- Item 1
- Item 2
- Item 3
`)
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Slidev Playground</h1>
    </header>
    <div class="main">
      <div class="editor-pane">
        <CodeMirrorEditor v-model="markdown" />
      </div>
      <div class="preview-pane">
        <pre class="preview">{{ markdown }}</pre>
      </div>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
}

.app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #181818;
  color: #e0e0e0;
}

.header {
  padding: 8px 16px;
  background: #1e1e1e;
  border-bottom: 1px solid #333;
}

.header h1 {
  font-size: 16px;
  font-weight: 600;
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-pane {
  flex: 1;
  overflow: hidden;
}

.preview-pane {
  flex: 1;
  overflow: auto;
  padding: 16px;
  border-left: 1px solid #333;
}

.preview {
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 14px;
}
</style>
