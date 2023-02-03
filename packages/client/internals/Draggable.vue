<script setup lang="ts">
import { ref } from 'vue'
import { useDraggable, useLocalStorage } from '@vueuse/core'

const props = defineProps<{
  storageKey?: string
  initial?: { x: number; y: number }
}>()

const el = ref<HTMLElement | null>(null)
const initial = props.initial ?? { x: 0, y: 0 }
const point = props.storageKey
  ? useLocalStorage(props.storageKey, initial)
  : ref(initial)
const { style } = useDraggable(el, { initialValue: point })
</script>

<template>
  <div ref="el" class="fixed" :style="style">
    <slot />
  </div>
</template>
