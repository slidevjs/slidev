<script setup lang="ts">
defineProps<{
  title: string
  icon?: string
}>()
</script>

<template>
  <button class="slidev-icon-btn" :title="title" v-bind="$attrs">
    <span class="sr-only">{{ title }}</span>
    <slot>
      <div :class="icon" />
    </slot>
  </button>
</template>
