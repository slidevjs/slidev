<script setup lang="ts">
import { serverState } from '../env'
</script>

<template>
  <div
    v-if="serverState.cursor"
    class="absolute top-0 left-0 right-0 bottom-0 pointer-events-none text-xl"
  >
    <ph:cursor-fill
      class="absolute"
      :style="{ left: `${serverState.cursor.x}%`, top: `${serverState.cursor.y}%` }"
    />
  </div>
</template>
