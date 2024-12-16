<script setup lang="ts">
import { watchEffect } from 'vue'
import { useNav } from '../../composables/useNav'
import { themeVars } from '../../env'
import { HandoutCover } from '#slidev/global-layers'

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
    <HandoutCover />
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
  margin-top: 1cm;
  margin-bottom: 1cm;
  margin-left: 1.5cm;
  margin-right: 1.5cm;
}
</style>
