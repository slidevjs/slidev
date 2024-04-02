<script setup lang="ts">
import type { DragElementMarkdownSource } from '../composables/useDragElements'
import { useDragElement } from '../composables/useDragElements'

const props = defineProps<{
  pos?: string
  markdownSource?: DragElementMarkdownSource
}>()

const { container, positionStyle, startDragging } = useDragElement(props.pos, props.markdownSource)
</script>

<template>
  <div ref="container" :style="positionStyle" @dblclick="startDragging">
    <slot />
  </div>
</template>
