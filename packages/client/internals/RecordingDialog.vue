<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { nextTick } from 'vue'
import { getFilename, mimeType, recordCamera, recorder, recordingName } from '../logic/recording'
import Modal from './Modal.vue'
import DevicesList from './DevicesList.vue'

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

function close() {
  value.value = false
}

async function start() {
  close()
  await nextTick()
  startRecording({
    mimeType: mimeType.value,
  })
}
</script>

<template>
  <Modal v-model="value" class="px-6 py-4 recording-dialog flex flex-col gap-2">
    <div class="flex gap-2 text-xl">
      <carbon:video class="my-auto" />Recording
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
      <DevicesList />
    </div>
    <div class="flex my-1">
      <button class="cancel" @click="close">
        Cancel
      </button>
      <div class="flex-auto" />
      <button @click="start">
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

  input[type="text"] {
    @apply border border-gray-400 rounded px-2 py-1;
  }

  button {
    @apply bg-orange-400 text-white px-4 py-1 rounded border-b-2 border-orange-600;
    @apply hover:(bg-orange-500 border-orange-700)
  }

  button.cancel {
    @apply bg-gray-400 text-white px-4 py-1 rounded border-b-2 border-gray-500;
    @apply bg-opacity-50 border-opacity-50;
    @apply hover:(bg-opacity-75 border-opacity-75)
  }
}
</style>
