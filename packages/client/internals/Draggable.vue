<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useEventListener, useStorage } from '@vueuse/core'

const props = withDefaults(defineProps<{
  storageKey: string
  initialX?: number
  initialY?: number
}>(), {
  initialX: 0,
  initialY: 0,
})

const point = useStorage(props.storageKey, { x: props.initialX, y: props.initialY })
const style = computed(() => {
  return {
    left: `${point.value.x}px`,
    top: `${point.value.y}px`,
  }
})

const el = ref<HTMLElement | null>(null)

onMounted(() => {
  let start: {x: number; y: number} | undefined
  useEventListener(el, 'pointerdown', (e: PointerEvent) => {
    if (e.target !== el.value)
      return
    const react = el.value!.getBoundingClientRect()
    start = {
      x: e.pageX - react.left,
      y: e.pageY - react.top,
    }
  })
  useEventListener('pointermove', (e: PointerEvent) => {
    if (!start)
      return
    point.value = {
      x: e.pageX - start.x,
      y: e.pageY - start.y,
    }
  })
  useEventListener('pointerup', (e: PointerEvent) => {
    start = undefined
  })
  // useEventListener('pointercancel', (e: PointerEvent) => {
  //   start = undefined
  // })
})
</script>

<template>
  <div ref="el" class="fixed" :style="style">
    <slot />
  </div>
</template>
