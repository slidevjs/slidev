<script setup lang="ts">
import type { SharedState } from '../state/shared'
import { computed } from 'vue'
import { sharedState } from '../state/shared'

const props = defineProps<{
  cursor?: SharedState['cursor']
}>()

const cursor = computed(() => props.cursor ?? sharedState.cursor)
</script>

<template>
  <div
    v-if="cursor"
    class="absolute top-0 left-0 right-0 bottom-0 pointer-events-none text-xl"
  >
    <div
      v-if="cursor.style === 'laser'"
      class="slidev-laser-pointer absolute"
      :style="{
        left: `${cursor.x}%`,
        top: `${cursor.y}%`,
      }"
    />
    <ph-cursor-fill
      v-else
      class="absolute stroke-white dark:stroke-black"
      :style="{
        left: `${cursor.x}%`,
        top: `${cursor.y}%`,
        strokeWidth: 16,
      }"
    />
  </div>
</template>

<style scoped>
.slidev-laser-pointer {
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle at center,
    rgba(255, 80, 80, 1) 0%,
    rgba(255, 0, 0, 0.95) 55%,
    rgba(255, 0, 0, 0.1) 100%
  );
  box-shadow:
    0 0 10px rgba(255, 0, 0, 0.9),
    0 0 22px rgba(255, 0, 0, 0.55);
}
</style>
