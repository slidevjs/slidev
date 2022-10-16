<script setup lang="ts">
import { computed, provide } from 'vue'
import { configs, slideAspect, slideWidth } from '../env'
import { injectionSlideScale } from '../constants'
import { rawRoutes } from '../logic/nav'
import PrintSlide from './PrintSlide.vue'

const props = defineProps<{
  width: number
}>()

const width = computed(() => props.width)
const height = computed(() => props.width / slideAspect)

const screenAspect = computed(() => width.value / height.value)

const scale = computed(() => {
  if (screenAspect.value < slideAspect)
    return width.value / slideWidth
  return (height.value * slideAspect) / slideWidth
})

// Remove the "end" slide
const routes = rawRoutes.slice(0, -1)

const className = computed(() => ({
  'select-none': !configs.selectable,
  'slidev-code-line-numbers': configs.lineNumbers,
}))

provide(injectionSlideScale, scale)
</script>

<template>
  <div id="print-container" :class="className">
    <div id="print-content">
      <PrintSlide v-for="route of routes" :key="route.path" :route="route" />
    </div>
    <slot name="controls" />
  </div>
</template>

<style lang="postcss">
#print-content {
  @apply bg-main;
}

.slide-container {
  @apply relative overflow-hidden break-after-page;
}
</style>
