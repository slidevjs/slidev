<script setup lang="ts">
const props = defineProps<{ class?: string; url: string }>()
</script>

<template>
  <div class="grid grid-cols-2 w-full h-full">
    <div class="h-full">
      <iframe id="frame" class="w-full h-full" :src="url" />
    </div>
    <div class="slidev-layout default" :class="props.class">
      <slot />
    </div>
  </div>
</template>
