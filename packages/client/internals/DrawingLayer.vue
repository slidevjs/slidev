<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { drauu, drawingEnabled, loadCanvas } from '../logic/drawings'
import { injectionSlideScale } from '../constants'

const scale = inject(injectionSlideScale)!
const svg = ref<SVGSVGElement>()

onMounted(() => {
  drauu.mount(svg.value!, svg.value!.parentElement!)
  watch(scale, scale => drauu.options.coordinateScale = 1 / scale, { immediate: true })
  loadCanvas()
})

onBeforeUnmount(() => {
  drauu.unmount()
})
</script>

<template>
  <svg
    ref="svg"
    class="w-full h-full absolute top-0"
    :class="{ 'pointer-events-none': !drawingEnabled, 'touch-none': drawingEnabled }"
  />
</template>
