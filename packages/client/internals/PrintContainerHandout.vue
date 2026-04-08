<script setup lang="ts">
import { provideLocal } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'
import { useNav } from '../composables/useNav'
import { injectionSlideScale } from '../constants'
import { configs, slideAspect, slideWidth } from '../env'
import PrintHandout from './PrintHandout.vue'

const props = defineProps<{
  width: number
  pageOffset?: number
}>()

const emit = defineEmits<{
  (e: 'pageCountChange', count: number): void
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
const paginateOverflow = computed(() => configs.handout.paginateOverflow)

const pageCounts = ref<Record<number, number>>({})
const pageBases = computed(() => {
  if (!paginateOverflow.value) {
    return Object.fromEntries(
      printRange.value.map((no, index) => [no, index + 1 + (props.pageOffset ?? 0)]),
    )
  }
  let current = props.pageOffset ?? 0
  const bases: Record<number, number> = {}
  for (const no of printRange.value) {
    bases[no] = current + 1
    current += pageCounts.value[no] ?? 1
  }
  return bases
})

const totalPageCount = computed(() => {
  if (!paginateOverflow.value)
    return printRange.value.length
  return printRange.value.reduce((sum, no) => sum + (pageCounts.value[no] ?? 1), 0)
})

function updatePageCount(slideNo: number, count: number) {
  if (!paginateOverflow.value)
    return
  if (pageCounts.value[slideNo] === count)
    return
  pageCounts.value = {
    ...pageCounts.value,
    [slideNo]: count,
  }
}

watchEffect(() => {
  emit('pageCountChange', totalPageCount.value)
})

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
        :page-base="pageBases[no]"
        :page-offset="props.pageOffset ?? 0"
        @page-count-change="updatePageCount(no, $event)"
      />
    </div>
  </div>
</template>

<style lang="postcss">
#print-content {
  @apply bg-main;
}
/* Ensure printed background is white regardless of theme */
html.print #print-content {
  background: #ffffff !important;
}
</style>
