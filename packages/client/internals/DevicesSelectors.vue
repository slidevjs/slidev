<script setup lang="ts">
import type { SelectionItem } from './types'
import { computed } from 'vue'
import {
  cameras,
  ensureDevicesListPermissions,
  microphones,
  mimeExtMap,
  mimeType,
  supportedMimeTypes,
} from '../logic/recording'
import { currentCamera, currentMic } from '../state'
import SelectList from './SelectList.vue'

const camerasItems = computed<SelectionItem<string>[]>(() => [
  {
    value: 'none',
    display: 'None',
  },
  ...cameras.value.map(i => ({
    value: i.deviceId,
    display: i.label,
  })),
])

const microphonesItems = computed<SelectionItem<string>[]>(() => [
  {
    value: 'none',
    display: 'None',
  },
  ...microphones.value.map(i => ({
    value: i.deviceId,
    display: i.label,
  })),
])

const mimeTypeItems = supportedMimeTypes.map(mime => ({
  value: mime,
  display: mimeExtMap[mime].toUpperCase(),
}))

ensureDevicesListPermissions()
</script>

<template>
  <div text-sm flex="~ col gap-2">
    <SelectList
      v-model="currentCamera"
      title="Camera"
      :items="camerasItems"
    />
    <div class="h-1px opacity-10 bg-current w-full" />
    <SelectList
      v-model="currentMic"
      title="Microphone"
      :items="microphonesItems"
    />
    <div class="h-1px opacity-10 bg-current w-full" />
    <SelectList
      v-if="mimeTypeItems.length"
      v-model="mimeType"
      title="Video Format"
      :items="mimeTypeItems"
    />
  </div>
</template>
