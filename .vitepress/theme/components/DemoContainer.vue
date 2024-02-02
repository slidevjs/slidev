<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

const error = ref<any>(null)

onErrorCaptured((err) => {
  error.value = err
})
</script>

<template>
  <div class="demo wide">
    <slot />
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>
