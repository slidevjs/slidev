<script setup lang="ts">
import { provideLocal, useElementSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useSlideScale } from '../composables/useSlideScale'
import { injectionSlideElement, injectionSlideScale } from '../constants'
import { slideAspect } from '../env'

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

const container = ref<HTMLDivElement | null>(null)
const containerSize = useElementSize(container)
const slideElement = ref<HTMLElement | null>(null)

const { scale, style: contentStyle } = useSlideScale(containerSize, props.width, props.isMain)

const containerStyle = computed(() => props.width
  ? {
      width: `${props.width}px`,
      height: `${props.width / slideAspect.value}px`,
    }
  : {},
)

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
  @apply relative overflow-hidden bg-main absolute left-1/2 top-1/2;
}
</style>
