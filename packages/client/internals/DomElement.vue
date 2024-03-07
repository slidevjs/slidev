<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const props = defineProps<{
  element: HTMLElement
}>()

const container = ref<HTMLElement>()

watchEffect(() => {
  if (container.value)
    container.value.appendChild(props.element)
})
</script>

<template>
  <div ref="container" />
</template>
