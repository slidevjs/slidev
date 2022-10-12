<script setup lang="ts">
import type { Slots } from 'vue'
import { h, watchEffect } from 'vue'
import { windowSize } from '../state'
import { isPrintMode } from '../logic/nav'
import { slideHeight, slideWidth, themeVars } from '../env'
import PrintContainer from './PrintContainer.vue'

function vStyle<Props>(props: Props, { slots }: { slots: Slots }) {
  if (slots.default)
    return h('style', slots.default())
}

watchEffect(() => {
  if (isPrintMode)
    (document.body.parentNode as HTMLElement).classList.add('print')
  else
    (document.body.parentNode as HTMLElement).classList.remove('print')
})
</script>

<template>
  <vStyle>
    @page { size: {{ slideWidth }}px {{ slideHeight }}px; margin: 0px; }
  </vStyle>
  <div id="page-root" class="grid grid-cols-[1fr_max-content]" :style="themeVars">
    <PrintContainer
      class="w-full h-full"
      :style="{ background: 'var(--slidev-slide-container-background, black)' }"
      :width="windowSize.width.value"
    />
  </div>
</template>

<style lang="postcss">
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
