<script setup lang="ts">
import { watchEffect } from 'vue'
import { windowSize } from '../../state'
import { useNav } from '../../composables/useNav'
import { themeVars } from '../../env'
import PrintContainerHandout from '../../internals/PrintContainerHandout.vue'

const { isPrintMode } = useNav()

watchEffect(() => {
  const html = document.body.parentNode as HTMLElement
  if (isPrintMode.value)
    html.classList.add('print')
  else
    html.classList.remove('print')
})
</script>

<template>
  <div id="page-root" class="grid grid-cols-[1fr_max-content]" :style="themeVars">
    <PrintContainerHandout class="w-full h-full" :width="windowSize.width.value" />
  </div>
</template>

<style>
html.print,
html.print body,
html.print #app {
  height: auto;
  overflow: auto;
}
html.print #page-root {
  height: auto;
  overflow: hidden;
}
html.print * {
  -webkit-print-color-adjust: exact;
}
html.print {
  width: 100%;
  height: 100%;
  overflow: visible;
}
html.print body {
  margin: 0 auto;
  border: 0;
  padding: 0;
  float: none;
  overflow: visible;
}

@page {
  size: A4;
  margin-top: 0cm;
  margin-bottom: 0cm;
  margin-left: 0cm;
  margin-right: 0cm;
}
</style>
