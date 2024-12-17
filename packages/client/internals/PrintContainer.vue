<script setup lang="ts">
import { provideLocal } from '@vueuse/core'
import { computed } from 'vue'
import { useNav } from '../composables/useNav'
import { injectionSlideScale } from '../constants'
import { configs, slideAspect, slideWidth } from '../env'
import PrintSlide from './PrintSlide.vue'

const props = defineProps<{
  width: number
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
      <PrintSlide v-for="no of printRange" :key="no" :route="slides[no - 1]" />
    </div>
  </div>
</template>
