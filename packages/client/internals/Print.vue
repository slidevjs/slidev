<script setup lang="ts">
import { watchEffect } from 'vue'
import { slideScale, windowSize } from '../state'
import { isPrintMode } from '../logic/nav'
import { themeVars } from '../env'
import PrintContainer from './PrintContainer.vue'

watchEffect(() => {
  if (isPrintMode)
    document.body.parentNode.classList.add('print')
  else
    document.body.parentNode.classList.remove('print')
})
</script>

<template>
  <div id="page-root" class="grid grid-cols-[1fr,max-content]" :style="themeVars">
    <PrintContainer
      class="w-full h-full"
      :style="{ background: 'var(--slidev-slide-container-background, black)'}"
      :width="windowSize.width.value"
    />
  </div>
</template>

<style lang="postcss">
@page {
  size: 980px 552px;
  margin: 0px;
}

html.print,
html.print body,
html.print #app,
html.print #page-root {
  height: auto;
  overflow: auto;
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
</style>
