<script setup lang="ts">
import { cameras, microphones, currentCamera, currentMic } from '../logic/recording'
</script>

<template>
  <div class="devices-list text-sm py-2">
    <div class="title">
      Camera
    </div>
    <div
      class="item"
      :class="{ active: currentCamera === 'none' }"
      @click="currentCamera = 'none'"
    >
      <carbon:checkmark class="text-green-500" />
      None
    </div>
    <div
      v-for="i of cameras"
      :key="i.deviceId"
      class="item"
      :class="{ active: currentCamera === i.deviceId }"
      @click="currentCamera = i.deviceId"
    >
      <carbon:checkmark class="text-green-500" />
      {{ i.label }}
    </div>

    <div class="title mt-2">
      Microphone
    </div>
    <div
      class="item"
      :class="{ active: currentMic === 'none' }"
      @click="currentMic = 'none'"
    >
      <carbon:checkmark class="text-green-500" />
      None
    </div>
    <div
      v-for="i of microphones"
      :key="i.deviceId"
      class="item"
      :class="{ active: currentMic === i.deviceId }"
      @click="currentMic = i.deviceId"
    >
      <carbon:checkmark class="text-green-500" />
      {{ i.label }}
    </div>
  </div>
</template>

<style lang="postcss">
.devices-list {
  @apply select-none;
  .item {
    @apply flex whitespace-nowrap py-1 px-4 cursor-default hover:(bg-gray-400 bg-opacity-10);

    svg {
      @apply mr-1 -ml-2;
    }

    &:not(.active) svg {
      @apply opacity-0;
    }
  }
  .title {
    @apply text-xs uppercase opacity-50 tracking-widest px-7 py-1;
  }
}
</style>
