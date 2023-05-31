<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { computed, provide, ref, watchEffect } from 'vue'
import { configs, slideAspect, slideHeight, slideWidth } from '../env'
import { injectionSlideScale } from '../constants'
import { isPrintMode } from '../logic/nav'

const props = defineProps({
  width: {
    type: Number,
  },
  meta: {
    default: () => ({}) as any,
  },
  scale: {
    type: [Number, String],
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
  if (props.scale && !isPrintMode.value)
    return props.scale
  if (screenAspect.value < slideAspect)
    return width.value / slideWidth
  return height.value * slideAspect / slideWidth
})

const style = computed(() => ({
  height: `${slideHeight}px`,
  width: `${slideWidth}px`,
  transform: `translate(-50%, -50%) scale(${scale.value})`,
}))

const className = computed(() => ({
  'select-none': !configs.selectable,
}))

provide(injectionSlideScale, scale)
</script>

<template>
  <div id="slide-container" ref="root" :class="className">
    <div id="slide-content" :style="style">
      <slot />
    </div>
    <slot name="controls" />
  </div>
</template>

<style lang="postcss">
#slide-container {
  @apply relative overflow-hidden break-after-page;
}

#slide-content {
  @apply relative overflow-hidden bg-main absolute left-1/2 top-1/2;
}
</style>
