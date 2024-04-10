<script setup lang="ts">
import { presenterLayout } from '../state'
</script>

<template>
  <div class="slidev-presenter bg-main h-full">
    <div class="grid-container children:bg-main" :class="`layout${presenterLayout}`">
      <div class="relative grid-area-[main] flex flex-col">
        <slot name="this-slide" class="h-full w-full p-2 lg:p-4 flex-auto" />
        <slot name="clicks-slider" class="w-full pb2 px4 flex-none" />
        <div class="absolute left-0 top-0 bg-main border-b border-r border-main px2 py1 op50 text-sm">
          Current
        </div>
      </div>
      <div class="relative grid-area-[next] flex flex-col p-2 lg:p-4">
        <slot name="next-slide" class="h-full w-full" />
        <div class="absolute left-0 top-0 bg-main border-b border-r border-main px2 py1 op50 text-sm">
          Next
        </div>
      </div>
      <!-- Notes -->
      <slot name="notes" class="grid-area-[note]" />
      <div class="grid-area-[bottom] flex">
        <slot name="nav-controls" />
        <div class="flex-auto" />
        <slot name="timer" />
      </div>
    </div>
    <div class="fixed left-0 right-0 top-0">
      <slot name="progress-bar" />
    </div>
  </div>
  <slot name="floating" />
</template>

<style scoped>
.slidev-presenter {
  --slidev-controls-foreground: current;
}

.grid-container {
  --uno: bg-gray/20;
  height: 100%;
  width: 100%;
  display: grid;
  gap: 1px 1px;
}

.grid-container.layout1 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 2fr 1fr min-content;
  grid-template-areas:
    'main main'
    'note next'
    'bottom bottom';
}

.grid-container.layout2 {
  grid-template-columns: 3fr 2fr;
  grid-template-rows: 2fr 1fr min-content;
  grid-template-areas:
    'note main'
    'note next'
    'bottom bottom';
}

@media (max-aspect-ratio: 3/5) {
  .grid-container.layout1 {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr 1fr min-content;
    grid-template-areas:
      'main'
      'note'
      'next'
      'bottom';
  }
}

@media (min-aspect-ratio: 1/1) {
  .grid-container.layout1 {
    grid-template-columns: 1fr 1.1fr 0.9fr;
    grid-template-rows: 1fr 2fr min-content;
    grid-template-areas:
      'main main next'
      'main main note'
      'bottom bottom bottom';
  }
}
</style>
