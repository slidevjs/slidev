<script setup lang="ts">
import { isEditorVertical } from '../state'
</script>

<template>
  <div class="grid" :class="isEditorVertical ? 'grid grid-rows-[1fr_max-content]' : 'grid grid-cols-[1fr_max-content]'" v-bind="$attrs">
    <slot name="slides" />
    <slot name="editor" />
  </div>
  <slot name="floating" />
</template>
