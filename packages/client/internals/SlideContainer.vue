<script setup lang="ts">
import { provideLocal, useElementSize, useStyleTag } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'
import { configs, slideAspect, slideHeight, slideWidth } from '../env'
import { injectionSlideScale } from '../constants'
import { clicksDirection, isPrintMode } from '../logic/nav'

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
  isMain: {
    type: Boolean,
    default: false,
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
  'height': `${slideHeight}px`,
  'width': `${slideWidth}px`,
  'transform': `translate(-50%, -50%) scale(${scale.value})`,
  '--slidev-slide-scale': scale.value,
}))

const className = computed(() => ({
  'select-none': !configs.selectable,
  'slidev-nav-go-forward': clicksDirection.value > 0,
  'slidev-nav-go-backward': clicksDirection.value < 0,
}))

if (props.isMain) {
  useStyleTag(computed(() => `
    :root {
      --slidev-slide-scale: ${scale.value};
    }
  `))
}

provideLocal(injectionSlideScale, scale as any)
</script>

<template>
  <div id="slide-container" ref="root" class="slidev-slides-container" :class="className">
    <div id="slide-content" class="slidev-slide-content" :style="style">
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
