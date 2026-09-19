<script setup lang="ts">
import type { NoiseSuppressionMode } from '../logic/recording'
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

const noiseSuppressionItems: SelectionItem<NoiseSuppressionMode>[] = [
  { value: 'disabled', display: 'Disabled' },
  { value: 'browser', display: 'Browser built-in' },
  { value: 'rnnoise', display: 'RNNoise' },
  { value: 'gtcrn', display: 'GTCRN' },
]

const noiseSuppressionHelp: Record<NoiseSuppressionMode, string> = {
  disabled: 'Keep the original microphone signal without noise suppression.',
  browser: 'Works reliably across browsers. Recommended for most recordings.',
  rnnoise: 'Good general-purpose suppression for voice and steady background noise.',
  gtcrn: 'Useful for heavier or changing background noise, with potentially higher CPU use.',
}

ensureDevicesListPermissions()
</script>

<template>
  <div text-sm flex="~ col gap-2" class="min-w-0">
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
        <SelectList
          v-model="noiseSuppression"
          title="Noise suppression"
          :items="noiseSuppressionItems"
        />
        <div class="text-xs opacity-50 leading-4 mt-1 max-w-64 break-words">
          {{ noiseSuppressionHelp[noiseSuppression] }}
        </div>
      </div>
    </template>
  </div>
</template>
