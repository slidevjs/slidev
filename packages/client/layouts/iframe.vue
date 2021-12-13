<script setup lang="ts">
defineProps<{ url: string }>()
</script>

<template>
  <div class="h-full w-full">
    <div class="w-full h-full">
      <iframe id="frame" class="w-full h-full" :src="url" />
    </div>
  </div>
</template>
