<script setup lang="ts">
import { shallowRef, useTemplateRef } from 'vue'

const video = useTemplateRef('video')
const stream = shallowRef<MediaStream | null>(null)
const started = shallowRef(false)

async function startCapture() {
  stream.value = await navigator.mediaDevices.getDisplayMedia({
    video: {
      // @ts-expect-error missing types
      cursor: 'always',
    },
    audio: false,
    selfBrowserSurface: 'include',
    preferCurrentTab: false,
  })
  video.value!.srcObject = stream.value
  video.value!.play()
  started.value = true
  stream.value.addEventListener('inactive', () => {
    video.value!.srcObject = null
    started.value = false
  })
  stream.value.addEventListener('ended', () => {
    video.value!.srcObject = null
    started.value = false
  })
}
</script>

<template>
  <div h-full w-full>
    <video v-show="started" ref="video" class="w-full h-full object-contain" />
    <div v-if="!started" w-full h-full flex="~ col gap-4 items-center justify-center">
      <div op50>
        Use screen capturing to mirror your main screen back to presenter view.<br>
        Click the button below and <b>select your other monitor or window</b>.
      </div>
      <button class="slidev-form-button" @click="startCapture">
        Start Screen Mirroring
      </button>
    </div>
  </div>
</template>
