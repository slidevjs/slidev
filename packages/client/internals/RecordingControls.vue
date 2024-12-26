<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { onMounted, watch } from 'vue'
import { recorder } from '../logic/recording'
import { currentCamera, showRecordingDialog } from '../state'
import DevicesSelectors from './DevicesSelectors.vue'
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
    <div class="i-carbon:user-avatar" />
  </IconButton>

  <IconButton
    :class="{ 'text-red-500': recording }"
    :title="recording ? 'Stop record video' : 'Record video'"
    @click="toggleRecording"
  >
    <div v-if="recording" class="i-carbon:stop-outline" />
    <div v-else class="i-carbon:video" />
  </IconButton>
  <MenuButton :disabled="recording">
    <template #button>
      <IconButton title="Select recording device" class="h-full !text-sm !px-0 aspect-initial">
        <div class="i-carbon:chevron-up opacity-50" />
      </IconButton>
    </template>
    <template #menu>
      <DevicesSelectors />
    </template>
  </MenuButton>
</template>
