<script setup lang="ts">
import { onMounted, ref } from 'vue'

const timeout = ref(false)
onMounted(() => {
  setTimeout(() => {
    timeout.value = true
  }, 200)
})
</script>

<template>
  <div class="h-full w-full flex items-center justify-center gap-2 slidev-slide-loading">
    <template v-if="timeout">
      <div class="i-svg-spinners-90-ring-with-bg text-xl" />
      <div>Loading slide...</div>
    </template>
  </div>
</template>
