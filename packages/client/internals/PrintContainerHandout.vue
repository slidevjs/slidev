<script setup lang="ts">
import { provideLocal } from '@vueuse/core'
import { computed } from 'vue'
import { useNav } from '../composables/useNav'
import { injectionSlideScale } from '../constants'
import { configs, slideAspect, slideWidth } from '../env'
import PrintHandout from './PrintHandout.vue'

const props = defineProps<{
  width: number
  pageOffset?: number
}>()

const { slides, printRange } = useNav()

const width = computed(() => props.width)
const height = computed(() => props.width / slideAspect.value)
const screenAspect = computed(() => width.value / height.value)

const scale = computed(() => {
  if (screenAspect.value < slideAspect.value)
    return width.value / slideWidth.value
  return (height.value * slideAspect.value) / slideWidth.value
})

const className = computed(() => ({
  'select-none': !configs.selectable,
}))

provideLocal(injectionSlideScale, scale)
</script>

<template>
  <div id="print-container" :class="className">
    <div id="print-content">
      <PrintHandout
        v-for="no of printRange"
        :key="no"
        :route="slides[no - 1]"
        :index="no - 1"
        :page-offset="props.pageOffset ?? 0"
      />
    </div>
  </div>
</template>

<style lang="postcss">
#print-content {
  @apply bg-main;
}
.print-slide-container {
  @apply relative overflow-hidden break-after-page translate-0;
}
/* Ensure printed background is white regardless of theme */
html.print #print-content {
  background: #ffffff !important;
}
</style>
