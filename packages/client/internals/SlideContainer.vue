<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { computed, defineProps, ref, watchEffect } from 'vue'
import { slideAspect, slideWidth, slideHeight } from '../constants'

const props = defineProps({
  width: {
    type: Number,
  },
})

const root = ref<HTMLDivElement>()
const element = useElementSize(root)

const width = computed(() => props.width ? props.width : element.width.value)
const height = computed(() => props.width ? props.width / slideAspect : element.height.value)

if (props.width) {
  watchEffect(() => {
    if (root.value) {
      root.value.style.width = `${width.value}px`
      root.value.style.height = `${height.value}px`
    }
  })
}

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
    <slot name="controls" />
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
