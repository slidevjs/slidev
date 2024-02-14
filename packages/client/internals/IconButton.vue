<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
  title: string
}>()
</script>

<template>
  <button class="slidev-icon-btn" :title="title" v-bind="$attrs">
    <span class="sr-only">{{ title }}</span>
    <slot />
  </button>
</template>
