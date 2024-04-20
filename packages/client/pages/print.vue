<script setup lang="ts">
import PrintTemplate from '#slidev/print-template'

document.documentElement.classList.add('print')
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
  transition-delay: 0ms !important;
  transition-duration: 50ms !important;
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
}
</style>
