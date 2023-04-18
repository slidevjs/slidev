<script setup lang="ts">
import { useDraggable, useEventListener, useLocalStorage } from '@vueuse/core'
import { computed, onMounted, ref, watchEffect } from 'vue'
import { currentCamera } from '../state'
import { recorder } from '../logic/recording'

const size = useLocalStorage('slidev-webcam-size', Math.round(Math.min(window.innerHeight, (window.innerWidth) / 8)))
const position = useLocalStorage('slidev-webcam-pos', {
  x: window.innerWidth - size.value - 30,
  y: window.innerHeight - size.value - 30,
}, { deep: true })

const frame = ref<HTMLDivElement | undefined>()
const handler = ref<HTMLDivElement | undefined>()
const video = ref<HTMLVideoElement | undefined>()

const { streamCamera, showAvatar } = recorder

const { style: containerStyle } = useDraggable(frame, {
  initialValue: position,
  onMove({ x, y }) {
    position.value.x = x
    position.value.y = y
  },
})
const { isDragging: handlerDown } = useDraggable(handler, {
  onMove({ x, y }) {
    size.value = Math.max(10, Math.min(x - position.value.x, y - position.value.y) / 0.8536)
  },
})

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
  // move back if the camera is outside of the canvas
  if (position.value.x >= window.innerWidth)
    position.value.x = window.innerWidth - size.value - 30
  if (position.value.y >= window.innerHeight)
    position.value.y = window.innerHeight - size.value - 30
}

useEventListener('resize', fixPosition)
onMounted(fixPosition)
</script>

<template>
  <div
    v-if="streamCamera && showAvatar && currentCamera !== 'none'"
    class="fixed z-10"
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
      class="absolute bottom-0 right-0 rounded-full bg-main shadow opacity-0 shadow z-30 hover:opacity-100 dark:border dark:border-true-gray-700"
      :style="handleStyle"
      :class="handlerDown ? '!opacity-100' : ''"
    />
  </div>
</template>
