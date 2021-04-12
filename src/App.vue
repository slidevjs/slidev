<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { computed } from 'vue'
import { scale, targetHeight, targetWidth } from './logic/scale'

useHead({
  title: 'Vite Slides',
  meta: [],
})

const style = computed(() => ({
  height: `${targetHeight}px`,
  width: `${targetWidth}px`,
  transform: `translate(-50%, -50%) scale(${scale.value})`,
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
