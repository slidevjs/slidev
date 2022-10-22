<script setup lang="ts">
import { computed } from 'vue'
import { handleBackground } from '../layoutHelper'

const props = defineProps({
  image: {
    type: String,
  },
  class: {
    type: String,
  },
})

const style = computed(() => handleBackground(props.image))
</script>

<template>
  <div class="grid grid-cols-2 w-full h-full auto-rows-fr">
    <div class="slidev-layout default" :class="props.class">
      <slot />
    </div>
    <div class="w-full w-full" :style="style" />
  </div>
</template>
