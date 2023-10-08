<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<template>
  <span class="sr-only">{{ text }}</span>
</template>
