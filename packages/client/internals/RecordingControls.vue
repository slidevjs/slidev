<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { onMounted, watch } from 'vue'
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

const previousAvatar = useLocalStorage('slidev-webcam-show', false)
watch(showAvatar, () => {
  previousAvatar.value = showAvatar.value
})

function toggleRecording() {
  if (recording.value)
    stopRecording()
  else
    showRecordingDialog.value = true
}

onMounted(() => {
  if (previousAvatar.value && !showAvatar.value)
    toggleAvatar()
})
</script>

<template>
  <button
    v-if="currentCamera !== 'none'"
    class="slidev-icon-btn <md:hidden"
    :class="{ 'text-green-500': Boolean(showAvatar && streamCamera) }"
    title="Show camera view"
    @click="toggleAvatar"
  >
    <carbon:user-avatar />
  </button>

  <button
    class="slidev-icon-btn"
    :class="{ 'text-red-500': recording }"
    title="Recording"
    @click="toggleRecording"
  >
    <carbon:stop-outline v-if="recording" />
    <carbon:video v-else />
  </button>
  <MenuButton :disabled="recording">
    <template #button>
      <button class="slidev-icon-btn h-full !text-sm !px-0">
        <carbon:chevron-up class="opacity-50" />
      </button>
    </template>
    <template #menu>
      <DevicesList />
    </template>
  </MenuButton>
</template>
