<script setup lang="ts">
import { ref } from 'vue'
import type { Position } from '@vueuse/core'
import { useDraggable, useStorage } from '@vueuse/core'

const props = defineProps<{
  storageKey?: string
  initial?: { x: number; y: number }
  onStart?: (position: Position, event: PointerEvent) => void | false
}>()

const el = ref<HTMLElement | null>(null)
const initial = props.initial ?? { x: 0, y: 0 }
const point = props.storageKey
  ? useStorage(props.storageKey, initial)
  : ref(initial)
const { style } = useDraggable(el, { initialValue: point, onStart: props.onStart })
</script>

<template>
  <div ref="el" class="fixed" :style="style">
    <slot />
  </div>
</template>
