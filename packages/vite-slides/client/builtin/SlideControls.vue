<script setup lang="ts">
import { useFullscreen } from '@vueuse/core'
import { computed, ref } from 'vue'
import Recorder from 'recordrtc'
import type { Options as RecorderOptions } from 'recordrtc'
import { isDark, toggleDark, useNavigateControls } from '../logic'
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(document.body)
const { hasNext, hasPrev, prev, next, current } = useNavigateControls()

const showOverview = ref(false)

const editorLink = computed(() => {
  const slide = current.value?.meta?.slide as any
  return (slide?.file && slide?.start)
    ? `vscode-insiders://file/${slide.file}:${slide.start}`
    : undefined
})

const recording = ref(false)

const { log } = console

function download(name: string, url: string) {
  const a = document.createElement('a')
  a.setAttribute('href', url)
  a.setAttribute('download', name)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

let recorderCamera: Recorder | undefined
let recorderSlides: Recorder | undefined

const config: RecorderOptions = {
  type: 'video',
  bitsPerSecond: 4 * 256 * 8 * 1024,
}

async function startRecording() {
  recorderCamera = new Recorder(
    await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    }),
    config,
  )
  recorderSlides = new Recorder(
    // @ts-expect-error
    await navigator.mediaDevices.getDisplayMedia({
      video: {
        aspectRatio: 1.6,
        frameRate: 15,
        width: 3840,
        height: 2160,
        cursor: 'motion',
        resizeMode: 'crop-and-scale',
      },
    }),
    config,
  )

  recorderCamera.startRecording()
  recorderSlides.startRecording()
  log('started')
}

async function stopRecording() {
  if (recorderCamera) {
    recorderCamera.stopRecording(() => {
      const blob = recorderCamera!.getBlob()
      const url = URL.createObjectURL(blob)
      download('camera.webm', url)
      window.URL.revokeObjectURL(url)
      recorderCamera = undefined
    })
  }
  if (recorderSlides) {
    recorderSlides.stopRecording(() => {
      const blob = recorderSlides!.getBlob()
      const url = URL.createObjectURL(blob)
      download('screen.webm', url)
      window.URL.revokeObjectURL(url)
      recorderSlides = undefined
    })
  }
  log('stopped')
}

function toggleRecord() {
  recording.value = !recording.value

  if (recording.value)
    startRecording()
  else
    stopRecording()
}
</script>

<template>
  <SlidesOverview v-model="showOverview" />
  <nav class="opacity-0 pb-4 pt-5 pl-6 pr-4 transition right-0 bottom-0 rounded-tl text-xl flex gap-4 text-gray-400 bg-transparent duration-300 fixed hover:(shadow bg-main opacity-100)">
    <a v-if="editorLink" class="icon-btn" :href="editorLink">
      <simple-icons:visualstudiocode />
    </a>

    <button class="icon-btn" :class="{'text-red-400': recording}" @click="toggleRecord">
      <carbon:recording-filled-alt />
    </button>

    <button class="icon-btn" @click="showOverview = !showOverview">
      <carbon:apps />
    </button>

    <button class="icon-btn" :class="{ disabled: !hasPrev }" @click="prev">
      <carbon:arrow-left />
    </button>

    <button class="icon-btn" :class="{ disabled: !hasNext }" @click="next">
      <carbon:arrow-right />
    </button>

    <button class="icon-btn" @click="toggleFullscreen">
      <carbon:minimize v-if="isFullscreen" />
      <carbon:maximize v-else />
    </button>

    <button class="icon-btn" @click="toggleDark">
      <carbon-moon v-if="isDark" />
      <carbon-sun v-else />
    </button>
  </nav>
</template>

<style scoped lang="postcss">
.icon-btn {
  @apply inline-block cursor-pointer select-none !outline-none;
  @apply opacity-75 transition duration-200 ease-in-out align-middle;
  @apply hover:(opacity-100 text-teal-600);
}
</style>
