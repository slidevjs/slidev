<script setup lang="ts">
import { useDrawings } from '../composables/useDrawings'

defineProps<{ page: number }>()

const { drawingState } = useDrawings()
</script>

<template>
  <svg
    v-if="drawingState[page]"
    class="w-full h-full absolute top-0 pointer-events-none"
    v-html="drawingState[page]"
  />
</template>
