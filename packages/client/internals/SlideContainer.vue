<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import { slideAspect, slideWidth, slideHeight } from '../constants'

const root = ref<HTMLDivElement>()
const { width, height } = useElementSize(root)
const screenAspect = computed(() => width.value / height.value)

const scale = computed(() => {
  if (screenAspect.value < slideAspect)
    return width.value / slideWidth
  return height.value * slideAspect / slideWidth
})

const style = computed(() => ({
  height: `${slideHeight}px`,
  width: `${slideWidth}px`,
  transform: `translate(-50%, -50%) scale(${scale.value})`,
}))
</script>

<template>
  <div id="slide-container" ref="root">
    <div id="slide-content" :style="style">
      <slot />
    </div>
  </div>
</template>

<style lang="postcss">
#slide-container {
  @apply relative overflow-hidden select-none;
}

#slide-content {
  @apply relative overflow-hidden m-auto bg-main absolute left-1/2 top-1/2;
}
</style>
