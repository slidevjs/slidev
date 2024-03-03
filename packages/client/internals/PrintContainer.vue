<script setup lang="ts">
import { parseRangeString } from '@slidev/parser/core'
import { computed } from 'vue'
import { provideLocal } from '@vueuse/core'
import { configs, slideAspect, slideWidth } from '../env'
import { injectionSlideScale } from '../constants'
import { route as currentRoute, slides } from '../logic/nav'
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

// In print mode, the routes will never change. So we don't need reactivity here.
let routes = slides.value
if (currentRoute.value.query.range) {
  const r = parseRangeString(routes.length, currentRoute.value.query.range as string)
  routes = r.map(i => routes[i - 1])
}

const className = computed(() => ({
  'select-none': !configs.selectable,
}))

provideLocal(injectionSlideScale, scale)
</script>

<template>
  <div id="print-container" :class="className">
    <div id="print-content">
      <PrintSlide v-for="route of routes" :key="route.no" :route="route" />
    </div>
    <slot name="controls" />
  </div>
</template>

<style lang="postcss">
#print-content {
  @apply bg-main;
}

.print-slide-container {
  @apply relative overflow-hidden break-after-page translate-0;
}
</style>
