<script setup lang="ts">
import type { CameraConfig } from '@slidev/types'
import type { CameraPlacement, CameraScreenRect } from '../logic/camera'
import { useDraggable, useElementBounding, useLocalStorage } from '@vueuse/core'
import { computed, ref, watch, watchEffect } from 'vue'
import { useNav } from '../composables/useNav'
import { configs, slideHeight, slideWidth } from '../env'
import { builtinCameraSize, CAMERA_MIN_SIZE, cameraAdjustmentTarget, cameraAnchorPosition, clampCameraToWindow, projectCamera, resolveCamera, unprojectCamera } from '../logic/camera'
import { recorder } from '../logic/recording'
import { currentCamera } from '../state'
import { mainSlideElement } from './SlideContainer.vue'

const { currentSlideNo, currentFrontmatter } = useNav()
const { streamCamera, showAvatar } = recorder

const canvas = computed(() => ({
  width: slideWidth.value,
  height: slideHeight.value,
}))

function defaultPlacement(): CameraPlacement {
  const size = builtinCameraSize(canvas.value)
  return {
    ...cameraAnchorPosition('bottom-right', canvas.value, size),
    size,
  }
}

const initial = defaultPlacement()
const storedSize = useLocalStorage('slidev-webcam-slide-size', initial.size)
const storedPosition = useLocalStorage('slidev-webcam-slide-pos', {
  x: initial.x,
  y: initial.y,
}, { deep: true })

/** Placement in slide-canvas pixels. */
const canvasPlacement = ref<CameraPlacement>({
  x: storedPosition.value.x,
  y: storedPosition.value.y,
  size: storedSize.value,
})
/** Drag and resize kept per slide until the page reloads, in canvas pixels. */
const sessionPlacements = new Map<number, CameraPlacement>()

const slideBounds = useElementBounding(mainSlideElement)
const slideRect = computed<CameraScreenRect>(() => ({
  left: slideBounds.left.value,
  top: slideBounds.top.value,
  width: slideBounds.width.value,
  height: slideBounds.height.value,
}))
const hasSlideBox = computed(() => slideRect.value.width > 0 && slideRect.value.height > 0)

const screenSize = ref(canvasPlacement.value.size)

const frame = ref<HTMLDivElement | undefined>()
const handler = ref<HTMLDivElement | undefined>()
const video = ref<HTMLVideoElement | undefined>()

const { x: dragX, y: dragY, style: containerStyle, isDragging } = useDraggable(frame, {
  initialValue: { x: 0, y: 0 },
  onMove({ x, y }) {
    rememberScreen(x, y, screenSize.value)
  },
})
const { isDragging: handlerDown } = useDraggable(handler, {
  onMove({ x, y }) {
    const nextScreenSize = Math.max(1, Math.min(x - dragX.value, y - dragY.value) / 0.8536)
    rememberScreen(dragX.value, dragY.value, nextScreenSize)
  },
})

function slideCamera(): CameraConfig | undefined {
  return currentFrontmatter.value?.camera as CameraConfig | undefined
}

function persist(placement: CameraPlacement) {
  if (cameraAdjustmentTarget(slideCamera(), configs.camera) === 'session') {
    sessionPlacements.set(currentSlideNo.value, placement)
    return
  }
  storedPosition.value = { x: placement.x, y: placement.y }
  storedSize.value = placement.size
}

function browserWindow() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

function syncScreen() {
  if (!hasSlideBox.value)
    return
  const projected = projectCamera(canvasPlacement.value, slideRect.value, canvas.value)
  const screen = clampCameraToWindow(projected, browserWindow())
  screenSize.value = screen.size
  dragX.value = screen.x
  dragY.value = screen.y
  if (screen.x === projected.x && screen.y === projected.y)
    return
  const next = unprojectCamera(screen, slideRect.value, canvas.value)
  canvasPlacement.value = next
  persist(next)
}

function rememberScreen(screenX: number, screenY: number, screenDiameter: number) {
  if (!hasSlideBox.value)
    return
  const screen = clampCameraToWindow(
    { x: screenX, y: screenY, size: screenDiameter },
    browserWindow(),
  )
  const next = unprojectCamera(screen, slideRect.value, canvas.value)
  next.size = Math.max(CAMERA_MIN_SIZE, next.size)
  canvasPlacement.value = next
  persist(next)
  syncScreen()
}

function applyForSlide() {
  const useSession = cameraAdjustmentTarget(slideCamera(), configs.camera) === 'session'
  canvasPlacement.value = resolveCamera({
    slide: slideCamera(),
    global: configs.camera,
    session: useSession ? sessionPlacements.get(currentSlideNo.value) : null,
    stored: {
      x: storedPosition.value.x,
      y: storedPosition.value.y,
      size: storedSize.value,
    },
    canvas: canvas.value,
  })
  syncScreen()
}

watch(
  [currentSlideNo, () => currentFrontmatter.value?.camera, () => configs.camera, canvas],
  () => {
    if (isDragging.value || handlerDown.value)
      return
    applyForSlide()
  },
  { immediate: true, deep: true },
)

watch(slideRect, () => {
  if (isDragging.value || handlerDown.value)
    return
  syncScreen()
})

watchEffect(() => {
  if (video.value)
    video.value.srcObject = streamCamera.value!
}, { flush: 'post' })

const frameStyle = computed(() => ({
  width: `${screenSize.value}px`,
  height: `${screenSize.value}px`,
}))

const handleStyle = computed(() => ({
  width: '14px',
  height: '14px',
  // 0.5 + 0.5 / sqrt(2)
  top: `${screenSize.value * 0.8536 - 7}px`,
  left: `${screenSize.value * 0.8536 - 7}px`,
  cursor: 'nwse-resize',
}))
</script>

<template>
  <div
    v-if="streamCamera && showAvatar && currentCamera !== 'none' && hasSlideBox"
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
