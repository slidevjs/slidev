<script setup lang="ts">
import { provideLocal, useElementSize } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'
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
const emit = defineEmits(['update:slide-element'])

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
watchEffect(() => emit('update:slide-element', slideElement.value))
</script>

<template>
  <div ref="container" class="slidev-slide-container" :style="containerStyle">
    <div ref="slideElement" class="slidev-slide-content" :style="contentStyle">
      <slot />
    </div>
    <slot name="controls" />
  </div>
</template>

<style lang="postcss">
.slidev-slide-container {
  @apply relative w-full h-full overflow-hidden;
  background: var(--slidev-slide-container-background, black);
}

.slidev-slide-content {
  @apply relative overflow-hidden bg-main absolute left-1/2 top-1/2;
}
</style>
