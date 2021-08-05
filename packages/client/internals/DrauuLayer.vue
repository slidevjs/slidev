<script setup lang="ts">
import { onMounted, ref, watch, inject } from 'vue'
import { createDrauu } from 'drauu'
import { drauuBrush, drauuMode } from '../state/drauu'
import { injectionSlideScale } from '../constants'

defineProps<{ enabled?: boolean }>()

const scale = inject(injectionSlideScale)!
const svg = ref<SVGSVGElement>()

onMounted(() => {
  const drauu = createDrauu({
    el: svg.value,
    brush: drauuBrush,
    mode: drauuMode.value,
    corrdinateScale: 1 / scale.value,
  })

  watch(drauuMode, mode => drauu.mode = mode)
  watch(scale, scale => drauu.options.corrdinateScale = 1 / scale)
})
</script>

<template>
  <svg ref="svg" :class="{ 'pointer-events-none': !enabled }"></svg>
</template>
