<script setup lang="ts">
import { computed, defineProps } from 'vue'
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
  <main class="grid grid-cols-2 w-full h-full">
    <div class="layout-master default" :class="props.class">
      <slot />
    </div>
    <div class="w-full w-full" :style="style"></div>
  </main>
</template>
