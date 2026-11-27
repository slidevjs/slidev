<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { computed, ref } from 'vue'

const slideAspect = 16 / 9
const slideWidth = 980
const slideHeight = 980 * 9 / 16

const root = ref<HTMLDivElement>()
const element = useElementSize(root)

const width = computed(() => element.width.value)
const height = computed(() => element.height.value)

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
  <div ref="root" class="slide-container">
    <div class="slide-content" :style="style">
      <slot />
    </div>
    <slot name="controls" />
  </div>
</template>

<style lang="postcss">
.slide-container {
  @apply relative overflow-hidden;
}

.slide-content {
  @apply relative overflow-hidden bg-main absolute left-1/2 top-1/2;
}
</style>
