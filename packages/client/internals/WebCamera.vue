<script setup lang="ts">
import { useEventListener, useStorage } from '@vueuse/core'
import { computed, onMounted, ref, watchEffect } from 'vue'
import { currentCamera } from '../state'
import { recorder } from '../logic/recording'

const size = useStorage('webcam-size', Math.round(Math.min(window.innerHeight, (window.innerWidth) / 8)))
const x = useStorage('webcam-x', window.innerWidth - size.value - 30)
const y = useStorage('webcam-y', window.innerHeight - size.value - 30)
const frame = ref<HTMLDivElement | undefined>()
const handler = ref<HTMLDivElement | undefined>()
const video = ref<HTMLVideoElement | undefined>()

const { streamCamera, showAvatar } = recorder

watchEffect(() => {
  if (video.value)
    video.value.srcObject = streamCamera.value!
}, { flush: 'post' })

const containerStyle = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
}))

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

const frameDown = ref(false)
const handlerDown = ref(false)
let deletaX = 0
let deletaY = 0

function fixPosistion() {
// move back if the camera is outside of the canvas
  if (x.value >= window.innerWidth)
    x.value = window.innerWidth - size.value - 30
  if (y.value >= window.innerHeight)
    y.value = window.innerHeight - size.value - 30
}

useEventListener(frame, 'pointerdown', (e: MouseEvent) => {
  if (frame.value) {
    frameDown.value = true
    const box = frame.value.getBoundingClientRect()
    deletaX = e.screenX - box.x
    deletaY = e.screenY - box.y
  }
})

useEventListener(handler, 'pointerdown', (e: MouseEvent) => {
  if (frame.value) {
    handlerDown.value = true
    const box = frame.value.getBoundingClientRect()
    deletaX = e.screenX - box.x
    deletaY = e.screenY - box.y
  }
})

useEventListener(window, 'pointerup', (e: MouseEvent) => {
  frameDown.value = false
  handlerDown.value = false
})

useEventListener(window, 'pointermove', (e: MouseEvent) => {
  if (frameDown.value) {
    x.value = e.screenX - deletaX
    y.value = e.screenY - deletaY
  }
  if (handlerDown.value && frame.value) {
    const box = frame.value.getBoundingClientRect()
    size.value = Math.max(10, Math.min(e.clientX - box.x, e.clientY - box.y) / 0.8536)
  }
})

useEventListener('resize', fixPosistion)

onMounted(fixPosistion)
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
        class="object-cover min-w-full min-h-full"
        style="transform: rotateY(180deg);"
      />
    </div>

    <div
      ref="handler"
      class="absolute bottom-0 right-0 rounded-full bg-main shadow opacity-0 shadow z-30 hover:opacity-100 dark:(border border-true-gray-700)"
      :style="handleStyle"
      :class="handlerDown ? '!opacity-100' : ''"
    >
    </div>
  </div>
</template>
