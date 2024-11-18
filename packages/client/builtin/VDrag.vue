<script setup lang="ts">
import type { DragElementMarkdownSource } from '../composables/useDragElements'
import { onMounted, onUnmounted } from 'vue'
import { useDragElement } from '../composables/useDragElements'

const props = defineProps<{
  pos?: string
  markdownSource?: DragElementMarkdownSource
}>()

const { dragId, container, containerStyle, mounted, unmounted, startDragging } = useDragElement(null, props.pos, props.markdownSource)

onMounted(mounted)
onUnmounted(unmounted)
</script>

<template>
  <div
    ref="container"
    :data-drag-id="dragId"
    :style="containerStyle"
    class="p-1"
    @dblclick="startDragging"
  >
    <slot />
  </div>
</template>
