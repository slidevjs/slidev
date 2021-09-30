<script setup lang="ts">
import { defineProps, ref } from "vue";
const props = defineProps({
  class: {
    type: String,
  },
  url: {
    type: String,
  },
});
var url = ref(props.url)
</script>

<template>
  <div class="grid grid-cols-2 w-full h-full">
    <div>
      <iframe id="frame" class="w-full h-full" :src="url"> </iframe>
    </div>
    <div class="slidev-layout default" :class="props.class">
      <slot />
    </div>
  </div>
</template>
