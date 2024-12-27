<script setup lang="ts">
import Badge from './Badge.vue'

defineProps<{
  options: { label: string, value: any }[]
  modelValue: any
}>()

defineEmits<{
  (event: 'update:modelValue', newValue: any): void
}>()
</script>

<template>
  <div flex="~ gap-1 items-center" rounded bg-gray:4 p1 m--1>
    <Badge
      v-for="option in options"
      :key="option.value"
      class="px-2 py-1 text-xs font-mono"
      :class="option.value === modelValue ? '' : 'op50'"
      :color="option.value === modelValue"
      :aria-pressed="option.value === modelValue"
      size="none"
      :text="option.label"
      as="button"
      @click="$emit('update:modelValue', option.value)"
    />
  </div>
</template>
