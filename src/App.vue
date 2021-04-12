<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { useElementSize } from '@vueuse/core'
import { computed, reactive } from 'vue'

useHead({
  title: 'Vite Slides',
  meta: [],
})

const apsect = 16 / 9
const targetWidth = 1920 / 2.2
const targetHeight = targetWidth / apsect

const screen = reactive(useElementSize(document.body))
const screenAspect = computed(() => screen.width / screen.height)

const width = computed(() => {
  if (screenAspect.value < apsect)
    return screen.width
  return screen.height * apsect
})

const style = computed(() => ({
  height: `${targetHeight}px`,
  width: `${targetWidth}px`,
  transform: `translate(-50%, -50%) scale(${width.value / targetWidth})`,
}))
</script>

<template>
  <div class="page">
    <div class="slide-container" :style="style">
      <router-view />
    </div>
  </div>
  <SlideControls />
</template>

<style>
.page {
  @apply w-screen h-screen relative overflow-hidden bg-black;
}

.slide-container {
  @apply relative overflow-hidden m-auto bg-main fixed left-1/2 top-1/2;
}
</style>
