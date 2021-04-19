<script setup lang="ts">
import { useEventListener, useStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { recorder } from '../logic/recording'

const size = useStorage('webcam-size', Math.round(Math.min(window.innerHeight, (window.innerWidth) / 8)))
const x = useStorage('webcam-x', window.innerWidth - size.value - 30)
const y = useStorage('webcam-y', window.innerHeight - size.value - 30)
const frame = ref<HTMLDivElement | undefined>()
const handler = ref<HTMLDivElement | undefined>()
const video = ref<HTMLVideoElement | undefined>()

const { streamCamera, showAvatar } = recorder

watch([streamCamera, video], () => {
  if (video.value && streamCamera.value)
    video.value.srcObject = streamCamera.value
}, { flush: 'post' })

const containerStyle = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
}))

const frameStyle = computed(() => ({
  width: `${size.value}px`,
  height: `${size.value}px`,
}))

const frameDown = ref(false)
const handlerDown = ref(false)
let deletaX = 0
let deletaY = 0

useEventListener(frame, 'mousedown', (e: MouseEvent) => {
  if (frame.value) {
    frameDown.value = true
    const box = frame.value.getBoundingClientRect()
    deletaX = e.screenX - box.x
    deletaY = e.screenY - box.y
  }
})

useEventListener(handler, 'mousedown', (e: MouseEvent) => {
  if (frame.value) {
    handlerDown.value = true
    const box = frame.value.getBoundingClientRect()
    deletaX = e.screenX - box.x
    deletaY = e.screenY - box.y
  }
})

useEventListener(window, 'mouseup', (e: MouseEvent) => {
  frameDown.value = false
  handlerDown.value = false
})

useEventListener(window, 'mousemove', (e: MouseEvent) => {
  if (frameDown.value) {
    x.value = e.screenX - deletaX
    y.value = e.screenY - deletaY
  }
  if (handlerDown.value && frame.value) {
    const box = frame.value.getBoundingClientRect()
    size.value = Math.min(e.screenX - box.x, e.screenY - box.y)
  }
})
</script>

<template>
  <div
    v-if="streamCamera && showAvatar"
    class="fixed z-50"
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
      class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-gray-400 opacity-0 shadow hover:opacity-100"
      style="cursor: nwse-resize"
      :class="handlerDown ? '!opacity-100' : ''"
    >
    </div>
  </div>
</template>
