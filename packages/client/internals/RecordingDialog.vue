<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { nextTick } from 'vue'
import { bitRate, frameRate, getFilename, mimeType, recordCamera, recorder, recordingName, resolution } from '../logic/recording'
import DevicesSelectors from './DevicesSelectors.vue'
import Modal from './Modal.vue'

const props = defineProps({
  modelValue: {
    default: false,
  },
})

const emit = defineEmits<{
  (e: any): void
}>()
const value = useVModel(props, 'modelValue', emit)

const { startRecording } = recorder

const frameRateOptions = [15, 24, 30, 60]
const resolutionOptions = [
  { value: '1280x720', label: '720p (1280x720)' },
  { value: '1920x1080', label: '1080p (1920x1080)' },
  { value: '2560x1440', label: '1440p (2560x1440)' },
  { value: '3840x2160', label: '2160p (3840x2160)' },
]

function close() {
  value.value = false
}

async function start() {
  close()
  await nextTick()
  startRecording({
    mimeType: mimeType.value,
    bitsPerSecond: bitRate.value * 1024,
  })
}
</script>

<template>
  <Modal v-model="value" class="px-6 py-4 recording-dialog flex flex-col gap-2">
    <div class="flex gap-2 text-xl">
      <div class="i-carbon:video my-auto" />Recording
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-2 py-2">
        <div class="form-text">
          <label for="title">Recording Name</label>
          <input
            v-model="recordingName"
            class="bg-transparent text-current"
            name="title"
            type="text"
            placeholder="Enter the title..."
          >
          <div class="text-xs w-full opacity-50 py-2">
            <div>This will be used in the output filename that might <br>help you better organize your recording chips.</div>
          </div>
        </div>

        <div class="form-text">
          <label for="framerate">Frame Rate</label>
          <select
            v-model="frameRate"
            class="bg-transparent text-current border border-main rounded px-2 py-1"
            name="framerate"
          >
            <option v-for="rate in frameRateOptions" :key="rate" :value="rate">
              {{ rate }} fps
            </option>
          </select>
        </div>

        <div class="form-text">
          <label for="resolution">Resolution</label>
          <select
            v-model="resolution"
            class="bg-transparent text-current border border-main rounded px-2 py-1"
            name="resolution"
          >
            <option v-for="res in resolutionOptions" :key="res.value" :value="res.value">
              {{ res.label }}
            </option>
          </select>
        </div>

        <div class="form-text">
          <label for="bitrate">Bitrate</label>
          <div class="relative">
            <input
              v-model.number="bitRate"
              type="number"
              min="1000"
              step="1000"
              class="bg-transparent text-current border border-main rounded px-2 py-1 w-full pr-12"
              name="bitrate"
            >
            <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm opacity-50">kbps</span>
          </div>
        </div>

        <div class="form-check">
          <input
            v-model="recordCamera"
            name="record-camera"
            type="checkbox"
          >
          <label for="record-camera" @click="recordCamera = !recordCamera">Record camera separately</label>
        </div>

        <div class="text-xs w-full opacity-50">
          <div class="mt-2 opacity-50">
            Enumerated filenames
          </div>
          <div class="font-mono">
            {{ getFilename('screen', mimeType) }}
          </div>
          <div v-if="recordCamera" class="font-mono">
            {{ getFilename('camera', mimeType) }}
          </div>
        </div>
      </div>
      <DevicesSelectors />
    </div>
    <div class="flex my-1">
      <button class="slidev-form-button" @click="close">
        Cancel
      </button>
      <div class="flex-auto" />
      <button class="slidev-form-button primary" @click="start">
        Start
      </button>
    </div>
  </Modal>
</template>

<style lang="postcss">
.recording-dialog {
  .form-text {
    @apply flex flex-col;

    label {
      @apply text-xs uppercase opacity-50 tracking-widest py-1;
    }
  }

  .form-check {
    @apply leading-5;

    * {
      @apply my-auto align-middle;
    }

    label {
      @apply ml-1 text-sm select-none;
    }
  }

  input[type='text'] {
    @apply border border-main rounded px-2 py-1;
  }
}
</style>
