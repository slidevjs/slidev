<script setup lang="ts">
import { defineProps, ref } from 'vue'
const props = defineProps({
  url: {
    type: String,
  },
})
const url = ref(props.url)
</script>

<template>
  <div class="h-full w-full">
    <div>
      <iframe id="frame" class="w-full h-full" :src="url"> </iframe>
    </div>
  </div>
</template>
