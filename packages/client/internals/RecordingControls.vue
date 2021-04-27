<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { ref } from 'vue'
import { recorder } from '../logic/recording'
import { currentCamera, showRecordingDialog } from '../state'
import DevicesList from './DevicesList.vue'

const devicesList = ref()
const showDevicesList = ref(false)

onClickOutside(devicesList, () => {
  showDevicesList.value = false
})

const {
  recording,
  showAvatar,
  streamCamera,
  stopRecording,
  toggleAvatar,
} = recorder

function toggleRecording() {
  if (recording.value)
    stopRecording()
  else
    showRecordingDialog.value = true
}
</script>

<template>
  <button
    v-if="currentCamera !== 'none'"
    class="icon-btn"
    :class="{'text-green-500': Boolean(showAvatar && streamCamera)}"
    title="Show camera view"
    @click="toggleAvatar"
  >
    <carbon:user-avatar />
  </button>

  <div
    ref="devicesList"
    class="flex relative"
  >
    <button
      class="icon-btn"
      :class="{'text-red-500': recording}"
      title="Recording"
      @click="toggleRecording"
    >
      <carbon:stop-outline v-if="recording" />
      <carbon:video v-else />
    </button>
    <button
      class="icon-btn !text-sm !px-0"
      :class="{disabled:recording}"
      @click="showDevicesList = !showDevicesList"
    >
      <carbon:chevron-up class="opacity-50" />
    </button>
    <DevicesList
      v-if="showDevicesList && !recording"
      class="bg-main rounded shadow bottom-10 left-0 z-20 absolute"
    />
  </div>
</template>
