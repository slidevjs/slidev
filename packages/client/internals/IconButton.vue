<script setup lang="ts">
defineProps<{
  title: string
  icon?: string
  as?: string
}>()
</script>

<template>
  <component :is="as || 'button'" class="slidev-icon-btn" :title="title" v-bind="$attrs">
    <span class="sr-only">{{ title }}</span>
    <slot>
      <div :class="icon" />
    </slot>
  </component>
</template>
