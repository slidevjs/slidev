<script setup lang="ts">
import { recorder } from '../logic/recording'
import { currentCamera, showRecordingDialog } from '../state'
import DevicesList from './DevicesList.vue'
import MenuButton from './MenuButton.vue'

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
    class="icon-btn <md:hidden"
    :class="{ 'text-green-500': Boolean(showAvatar && streamCamera) }"
    title="Show camera view"
    @click="toggleAvatar"
  >
    <carbon:user-avatar />
  </button>

  <button
    class="icon-btn"
    :class="{ 'text-red-500': recording }"
    title="Recording"
    @click="toggleRecording"
  >
    <carbon:stop-outline v-if="recording" />
    <carbon:video v-else />
  </button>
  <MenuButton :disabled="recording">
    <template #button>
      <button class="icon-btn h-full !text-sm !px-0">
        <carbon:chevron-up class="opacity-50" />
      </button>
    </template>
    <template #menu>
      <DevicesList />
    </template>
  </MenuButton>
</template>
