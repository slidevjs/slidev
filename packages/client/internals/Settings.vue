<script setup lang="ts">
import { slideScale } from '../state'

function setScale(v: number | undefined) {
  slideScale.value = v
}
</script>

<template>
  <div class="devices-list text-sm py-2">
    <div class="title">
      Scale
    </div>
    <div class="item" :class="{ active: true }" @click="setScale(undefined)">
      <carbon:checkmark class="text-green-500" />Fit
    </div>
    <div class="item" :class="{ active: false }" @click="setScale(1)">
      <carbon:checkmark class="text-green-500" />1:1
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
