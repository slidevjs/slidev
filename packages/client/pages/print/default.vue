<script setup lang="ts">
import { provideLocal } from '@vueuse/core'
import { computed } from 'vue'
import { injectionSlideScale } from '../../constants'
import { slideHeight, slideWidth } from '../../env'
import { usePrintContext } from '../../composables/usePrintContext'
import SlidesPrintShow from '../../internals/SlidesPrintShow.vue'

usePrintContext()

provideLocal(injectionSlideScale, computed(() => 1))
</script>

<template>
  <div class="print-slide-container">
    <SlidesPrintShow />
  </div>
</template>

<style scoped lang="postcss">
@page {
  size: v-bind('`${slideWidth}px`') v-bind('`${slideHeight}px`');
  margin: 0;
}

.print-slide-container {
  @apply relative overflow-hidden break-before-page translate-0;
  width: v-bind('`${slideWidth}px`');
  height: v-bind('`${slideHeight}px`');
}
</style>
