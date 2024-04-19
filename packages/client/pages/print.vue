<script setup lang="ts">
import { recomputeAllPoppers } from 'floating-vue'
import { onMounted } from 'vue'
import PrintTemplate from '#slidev/print-template'

document.documentElement.classList.add('print')

onMounted(() => {
  setTimeout(recomputeAllPoppers, 300)
})
</script>

<template>
  <div id="page-root">
    <PrintTemplate />
    <div id="twoslash-container" />
  </div>
</template>

<style>
html,
html body,
html #app {
  height: auto;
  overflow: auto;
}
html #page-root {
  height: auto;
  overflow: hidden;
}
html * {
  -webkit-print-color-adjust: exact;
}
html {
  width: 100%;
  height: 100%;
  overflow: visible;
}
html body {
  margin: 0 auto;
  border: 0;
  padding: 0;
  float: none;
  overflow: visible;
  background-color: white;
}
</style>
