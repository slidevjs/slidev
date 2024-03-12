<script setup lang="ts">
import { watchEffect } from 'vue'
import { useNav } from '../../composables/useNav'
import { themeVars } from '../../env'
import { useStyleTag } from '@vueuse/core'

const { isPrintMode } = useNav()

// @ts-expect-error virtual module
import HandoutCover from '/@slidev/global-components/handout-cover'

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
  margin-top: 1.0cm;
  margin-bottom: 1.0cm;
  margin-left: 1.5cm;
  margin-right: 1.5cm;
}
`)
</script>

<template>
    <div id="page-root" class="grid grid-cols-[1fr_max-content]" :style="themeVars">
        <HandoutCover />
    </div>
</template>

<style lang="postcss"></style>