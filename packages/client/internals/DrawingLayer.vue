<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { drauu, loadCanvas } from '../logic/drawings'

const svg = ref<SVGSVGElement>()

onMounted(() => {
  drauu.mount(svg.value!, svg.value!.parentElement!)
  loadCanvas()
})

onBeforeUnmount(() => {
  drauu.unmount()
})
</script>

<template>
  <svg
    ref="svg"
    class="w-full h-full absolute top-0 pointer-events-none"
  ></svg>
</template>
