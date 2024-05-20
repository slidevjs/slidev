<script setup lang="ts">
import { provideLocal, useElementSize, useStyleTag } from '@vueuse/core'
import { computed, ref } from 'vue'
import { injectionSlideElement, injectionSlideScale } from '../constants'
import { slideAspect, slideHeight, slideWidth } from '../env'
import { useNav } from '../composables/useNav'
import { slideScale } from '../state'

const props = defineProps({
  width: {
    type: Number,
  },
  meta: {
    default: () => ({}) as any,
  },
  isMain: {
    type: Boolean,
    default: false,
  },
})

const { isPrintMode } = useNav()

const container = ref<HTMLDivElement | null>(null)
const containerSize = useElementSize(container)
const slideElement = ref<HTMLElement | null>(null)

const width = computed(() => props.width ?? containerSize.width.value)
const height = computed(() => props.width ? props.width / slideAspect.value : containerSize.height.value)

const scale = computed(() => {
  if (slideScale.value && !isPrintMode.value)
    return +slideScale.value
  return Math.min(width.value / slideWidth.value, height.value / slideHeight.value)
})

const contentStyle = computed(() => ({
  'height': `${slideHeight.value}px`,
  'width': `${slideWidth.value}px`,
  'transform': `translate(-50%, -50%) scale(${scale.value})`,
  '--slidev-slide-scale': scale.value,
}))

const containerStyle = computed(() => props.width
  ? {
      width: `${props.width}px`,
      height: `${props.width / slideAspect.value}px`,
    }
  : {},
)

if (props.isMain)
  useStyleTag(computed(() => `:root { --slidev-slide-scale: ${scale.value}; }`))

provideLocal(injectionSlideScale, scale)
provideLocal(injectionSlideElement, slideElement)
</script>

<template>
  <div :id="isMain ? 'slide-container' : undefined" ref="container" class="slidev-slide-container" :style="containerStyle">
    <div :id="isMain ? 'slide-content' : undefined" ref="slideElement" class="slidev-slide-content" :style="contentStyle">
      <slot />
    </div>
    <slot name="controls" />
  </div>
</template>

<style scoped lang="postcss">
.slidev-slide-container {
  @apply relative w-full h-full overflow-hidden;
}

.slidev-slide-content {
  @apply absolute left-1/2 top-1/2 overflow-hidden bg-main;
}
</style>
