<script setup lang="ts">
import { provideLocal, useElementSize } from '@vueuse/core'
import { computed, onUnmounted, ref, watchEffect } from 'vue'
import { useNav } from '../composables/useNav'
import { injectionSlideElement, injectionSlideScale } from '../constants'
import { slideAspect, slideHeight, slideWidth } from '../env'
import { isDark } from '../logic/dark'
import { snapshotManager } from '../logic/snapshot'
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
  no: {
    type: Number,
    required: false,
  },
  useSnapshot: {
    type: Boolean,
    default: false,
  },
  contentStyle: {
    type: Object,
    default: () => ({}),
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
  ...props.contentStyle,
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

if (props.isMain) {
  const rootStyle = document.documentElement.style
  watchEffect(() => rootStyle.setProperty('--slidev-slide-scale', scale.value.toString()))
  onUnmounted(() => rootStyle.removeProperty('--slidev-slide-scale'))
}

provideLocal(injectionSlideScale, scale)
provideLocal(injectionSlideElement, slideElement)

const snapshot = computed(() => {
  if (props.no == null || !props.useSnapshot)
    return undefined
  return snapshotManager.getSnapshot(props.no, isDark.value)
})
</script>

<template>
  <div
    v-if="!snapshot"
    :id="isMain ? 'slide-container' : undefined"
    ref="container"
    class="slidev-slide-container"
    :style="containerStyle"
  >
    <div
      :id="isMain ? 'slide-content' : undefined"
      ref="slideElement"
      class="slidev-slide-content"
      :style="contentStyle"
    >
      <slot />
    </div>
    <slot name="controls" />
  </div>
  <!-- Image Snapshot -->
  <div v-else class="slidev-slide-container w-full h-full relative">
    <img
      :src="snapshot"
      class="w-full h-full object-cover"
      :style="containerStyle"
    >
    <div absolute bottom-1 right-1 p0.5 text-cyan:75 bg-cyan:10 rounded title="Snapshot">
      <div class="i-carbon-camera" />
    </div>
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
