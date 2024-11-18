<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { onMounted, watch } from 'vue'
import { recorder } from '../logic/recording'
import { currentCamera, showRecordingDialog } from '../state'
import DevicesList from './DevicesList.vue'
import IconButton from './IconButton.vue'
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
  <IconButton
    v-if="currentCamera !== 'none'"
    class="<md:hidden"
    :class="{ 'text-green-500': Boolean(showAvatar && streamCamera) }"
    title="Toggle camera view"
    @click="toggleAvatar"
  >
    <carbon:user-avatar />
  </IconButton>

  <IconButton
    :class="{ 'text-red-500': recording }"
    :title="recording ? 'Stop record video' : 'Record video'"
    @click="toggleRecording"
  >
    <carbon:stop-outline v-if="recording" />
    <carbon:video v-else />
  </IconButton>
  <MenuButton :disabled="recording">
    <template #button>
      <IconButton title="Select recording device" class="h-full !text-sm !px-0 aspect-initial">
        <carbon:chevron-up class="opacity-50" />
      </IconButton>
    </template>
    <template #menu>
      <DevicesList />
    </template>
  </MenuButton>
</template>
