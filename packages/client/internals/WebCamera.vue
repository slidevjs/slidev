<script setup lang="ts">
import type { CameraConfig } from '@slidev/types'
import type { CameraPlacement } from '../logic/camera'
import { useDraggable, useEventListener, useLocalStorage } from '@vueuse/core'
import { computed, ref, watch, watchEffect } from 'vue'
import { useNav } from '../composables/useNav'
import { configs } from '../env'
import { builtinCameraSize, CAMERA_EDGE_MARGIN, CAMERA_MIN_SIZE, cameraAdjustmentTarget, clampCameraToViewport, resolveCamera } from '../logic/camera'
import { recorder } from '../logic/recording'
import { currentCamera } from '../state'

const { currentSlideNo, currentFrontmatter } = useNav()
const { streamCamera, showAvatar } = recorder

function viewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

const storedSize = useLocalStorage('slidev-webcam-size', builtinCameraSize(viewport()))
const storedPosition = useLocalStorage('slidev-webcam-pos', {
  x: window.innerWidth - storedSize.value - CAMERA_EDGE_MARGIN,
  y: window.innerHeight - storedSize.value - CAMERA_EDGE_MARGIN,
}, { deep: true })

const size = ref(storedSize.value)
/** Drag and resize kept per slide until the page reloads. */
const sessionPlacements = new Map<number, CameraPlacement>()

const frame = ref<HTMLDivElement | undefined>()
const handler = ref<HTMLDivElement | undefined>()
const video = ref<HTMLVideoElement | undefined>()

const { x: dragX, y: dragY, style: containerStyle, isDragging } = useDraggable(frame, {
  initialValue: () => ({ x: storedPosition.value.x, y: storedPosition.value.y }),
  onMove({ x, y }) {
    remember(x, y, size.value)
  },
})
const { isDragging: handlerDown } = useDraggable(handler, {
  onMove({ x, y }) {
    const nextSize = Math.max(CAMERA_MIN_SIZE, Math.min(x - dragX.value, y - dragY.value) / 0.8536)
    size.value = nextSize
    remember(dragX.value, dragY.value, nextSize)
  },
})

function slideCamera(): CameraConfig | undefined {
  return currentFrontmatter.value?.camera as CameraConfig | undefined
}

function remember(x: number, y: number, nextSize: number) {
  if (cameraAdjustmentTarget(slideCamera(), configs.camera) === 'session') {
    sessionPlacements.set(currentSlideNo.value, { x, y, size: nextSize })
    return
  }
  storedPosition.value = { x, y }
  storedSize.value = nextSize
}

function applyForSlide() {
  const view = viewport()
  const useSession = cameraAdjustmentTarget(slideCamera(), configs.camera) === 'session'
  const resolved = resolveCamera({
    slide: slideCamera(),
    global: configs.camera,
    session: useSession ? sessionPlacements.get(currentSlideNo.value) : null,
    stored: {
      x: storedPosition.value.x,
      y: storedPosition.value.y,
      size: storedSize.value,
    },
    viewport: view,
  })
  const next = clampCameraToViewport(resolved, view)
  size.value = next.size
  dragX.value = next.x
  dragY.value = next.y
  if (next.x !== resolved.x || next.y !== resolved.y)
    remember(next.x, next.y, next.size)
}

watch(
  [currentSlideNo, () => currentFrontmatter.value?.camera, () => configs.camera],
  () => {
    if (isDragging.value || handlerDown.value)
      return
    applyForSlide()
  },
  { immediate: true, deep: true },
)

watchEffect(() => {
  if (video.value)
    video.value.srcObject = streamCamera.value!
}, { flush: 'post' })

const frameStyle = computed(() => ({
  width: `${size.value}px`,
  height: `${size.value}px`,
}))

const handleStyle = computed(() => ({
  width: '14px',
  height: '14px',
  // 0.5 + 0.5 / sqrt(2)
  top: `${size.value * 0.8536 - 7}px`,
  left: `${size.value * 0.8536 - 7}px`,
  cursor: 'nwse-resize',
}))

function fixPosition() {
  // A configured anchor is resolution-independent until the presenter drags it.
  if (!sessionPlacements.has(currentSlideNo.value)) {
    applyForSlide()
    return
  }
  const next = clampCameraToViewport({
    x: dragX.value,
    y: dragY.value,
    size: size.value,
  }, viewport())
  if (next.x === dragX.value && next.y === dragY.value)
    return
  dragX.value = next.x
  dragY.value = next.y
  remember(next.x, next.y, next.size)
}

useEventListener('resize', fixPosition)
</script>

<template>
  <div
    v-if="streamCamera && showAvatar && currentCamera !== 'none'"
    class="fixed z-camera"
    :style="containerStyle"
  >
    <div
      ref="frame"
      class="rounded-full shadow bg-gray-400 bg-opacity-10 overflow-hidden object-cover"
      :style="frameStyle"
    >
      <video
        ref="video"
        autoplay
        muted
        volume="0"
        class="object-cover min-w-full min-h-full rounded-full"
        style="transform: rotateY(180deg);"
      />
    </div>

    <div
      ref="handler"
      class="absolute bottom-0 right-0 rounded-full bg-main shadow opacity-0 shadow z-dragging hover:opacity-100 dark:border dark:border-true-gray-700"
      :style="handleStyle"
      :class="handlerDown ? '!opacity-100' : ''"
    />
  </div>
</template>
