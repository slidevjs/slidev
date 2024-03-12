<script setup lang="ts">
import { watchEffect } from 'vue'
import { useStyleTag } from '@vueuse/core'
import { windowSize } from '../../state'
import { useNav } from '../../composables/useNav'
import { themeVars } from '../../env'
import HandoutPrintContainer from '../../internals/HandoutPrintContainer.vue'

const { isPrintMode } = useNav()

watchEffect(() => {
    if (isPrintMode)
        (document.body.parentNode as HTMLElement).classList.add('print')
    else
        (document.body.parentNode as HTMLElement).classList.remove('print')
})

useStyleTag(`
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
  margin-left: 0.0cm;
  margin-right: 0.0cm;
}
`)
</script>

<template>
    <div id="page-root" class="grid grid-cols-[1fr_max-content]" :style="themeVars">
        <HandoutPrintContainer class="w-full h-full" :width="windowSize.width.value" />
    </div>
</template>

<style lang="postcss"></style>
