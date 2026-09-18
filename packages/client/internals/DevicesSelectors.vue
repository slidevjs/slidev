<script setup lang="ts">
import type { SelectionItem } from './types'
import { computed } from 'vue'
import {
  cameras,
  echoCancellation,
  ensureDevicesListPermissions,
  microphones,
  noiseSuppression,
} from '../logic/recording'
import { currentCamera, currentMic } from '../state'
import SelectList from './SelectList.vue'

const props = defineProps<{
  section?: 'video' | 'audio'
}>()

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

ensureDevicesListPermissions()
</script>

<template>
  <div text-sm flex="~ col gap-2">
    <template v-if="props.section !== 'audio'">
      <SelectList
        v-model="currentCamera"
        title="Camera"
        :items="camerasItems"
      />
      <div v-if="props.section === undefined && $slots['video-after']" class="h-1px opacity-10 bg-current w-full" />
      <slot name="video-after" />
      <div v-if="props.section === undefined" class="h-1px opacity-10 bg-current w-full" />
    </template>

    <template v-if="props.section !== 'video'">
      <SelectList
        v-model="currentMic"
        title="Microphone"
        :items="microphonesItems"
      />
      <div class="form-check ml-2">
        <input
          id="echo-cancellation"
          v-model="echoCancellation"
          name="echo-cancellation"
          type="checkbox"
        >
        <label for="echo-cancellation">Echo cancellation</label>
      </div>
      <div class="form-check ml-2">
        <input
          id="noise-suppression"
          v-model="noiseSuppression"
          name="noise-suppression"
          type="checkbox"
        >
        <label for="noise-suppression">Noise suppression</label>
      </div>
    </template>
  </div>
</template>
