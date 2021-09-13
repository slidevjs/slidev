<script setup lang="ts">
import { ref } from 'vue'
import { useStorage, useDraggable } from '@vueuse/core'
import type { Position } from '@vueuse/core'

const props = defineProps<{
  storageKey?: string
  initial?: Position
}>()

const el = ref<HTMLElement | null>(null)
const initial = props.initial ?? { x: 0, y: 0 }
const point = props.storageKey
  ? useStorage(props.storageKey, initial)
  : ref(initial)
const { style } = useDraggable(el, { initial: point })
</script>

<template>
  <div ref="el" class="fixed" :style="style">
    <slot />
  </div>
</template>
