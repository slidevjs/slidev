<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import type { DragElementMarkdownSource } from '../composables/useDragElements'
import { useDragElement } from '../composables/useDragElements'

const props = defineProps<{
  pos?: string
  markdownSource?: DragElementMarkdownSource
}>()

const { id, container, positionStyle, mounted, unmounted, startDragging } = useDragElement(null, props.pos, props.markdownSource)

onMounted(mounted)
onUnmounted(unmounted)
</script>

<template>
  <div
    ref="container"
    :data-drag-id="id"
    :style="positionStyle"
    class="p-1"
    @dblclick="startDragging"
  >
    <slot />
  </div>
</template>
