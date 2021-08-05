<script setup lang="ts">
import { onMounted, ref, watch, inject, onBeforeUnmount } from 'vue'
import { drauuEnabled, drauu } from '../logic/drauu'
import { injectionSlideScale } from '../constants'

const scale = inject(injectionSlideScale)!
const svg = ref<SVGSVGElement>()

onMounted(() => {
  drauu.mount(svg.value!)
  watch(scale, scale => drauu.options.corrdinateScale = 1 / scale, { immediate: true })
})

onBeforeUnmount(() => {
  drauu.unmount()
})
</script>

<template>
  <svg
    ref="svg"
    class="w-full h-full absolute top-0"
    :class="{ 'pointer-events-none': !drauuEnabled }"
  ></svg>
</template>
