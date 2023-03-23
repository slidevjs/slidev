<script setup lang="ts">
import { drawingState } from '../logic/drawings'

defineProps<{ page: number }>()
</script>

<template>
  <svg
    v-if="drawingState[page]"
    class="w-full h-full absolute top-0 pointer-events-none"
    v-html="drawingState[page]"
  />
</template>
