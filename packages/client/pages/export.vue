<script setup lang="ts">
import { parseRangeString } from '@slidev/parser/utils'
import { provideLocal, useElementSize } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { useNav } from '../composables/useNav'
import { injectionSlideScale } from '../constants'
import { slideWidth } from '../env'
import PrintSlide from '../internals/PrintSlide.vue'

const { slides, isPrintWithClicks } = useNav()
const { width } = useElementSize(useTemplateRef('print-container'))
const scale = computed(() => width.value / slideWidth.value)
const ranges = ref('')
const routes = computed(() => parseRangeString(slides.value.length, ranges.value).map(i => slides.value[i - 1]))

provideLocal(injectionSlideScale, scale)

function pdf() {
  window.print()
}
</script>

<template>
  <div class="fixed inset-6 flex flex-col md:flex-row gap-8 print:position-unset print:inset-0 print:block print:min-h-max">
    <div class="print:hidden min-w-fit">
      <h1 class="text-3xl m-4 print:hidden">
        Export Slides
      </h1>
      <label class="text-xl flex gap-2 items-center select-none">
        <input v-model="isPrintWithClicks" type="checkbox">
        <span> with clicks </span>
      </label>
      <div class="flex flex-col gap-2 items-start">
        <button @click="pdf">
          Export to PDF
        </button>
        <button @click="pdf">
          Export to PPTX
        </button>
        <button @click="pdf">
          Export to Images
        </button>
      </div>
    </div>
    <div id="print-container" ref="print-container">
      <div id="print-content">
        <PrintSlide v-for="route of routes" :key="route.no" :route="route" />
      </div>
    </div>
  </div>
</template>

<style scoped>
@media not print {
  #print-container {
    scrollbar-width: thin;
    scroll-behavior: smooth;
    @apply w-full overflow-x-hidden overflow-y-auto outline outline-white outline-solid max-h-full;
  }

  #print-content {
    transform: v-bind('`scale(${scale})`');
    @apply origin-tl flex flex-col;
  }
}

@media print {
  .scaler {
    transform: scale(1);
  }
}

button {
  @apply w-full rounded bg-gray:10 p4 hover:bg-gray/20;
}
</style>

<style>
@media print {
  html,
  body,
  #app {
    overflow: unset !important;
  }
}
</style>
