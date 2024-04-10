<script setup lang="ts">
import { isEditorVertical, slideScale, windowSize } from '../state'
import { useNav } from '../composables/useNav'

const { isPrintMode } = useNav()
</script>

<template>
  <div class="grid" :class="isEditorVertical ? 'grid-rows-[1fr_max-content]' : 'grid-cols-[1fr_max-content]'" v-bind="$attrs">
    <slot
      name="slides"
      class="w-full h-full"
      :style="{ background: 'var(--slidev-slide-container-background, black)' }"
      :width="isPrintMode ? windowSize.width.value : undefined"
      :scale="slideScale"
    />
    <slot name="editor" />
  </div>
  <slot name="floating" />
</template>
