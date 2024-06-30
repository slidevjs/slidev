<script setup lang="ts">
import VPMenuGroup from 'vitepress/dist/client/theme-default/components/VPMenuGroup.vue'

defineProps<{
  version?: string
}>()
</script>

<template>
  <VPMenuGroup
    v-if="version" text="Since" :items="[
      { text: version, link: `https://github.com/slidevjs/slidev/releases/tag/${version}` },
    ]"
  />
</template>
