<script setup lang="ts">
import { handleBackground } from '@slidev/client/layoutHelper'
import { computed } from 'vue'

const props = defineProps({
  background: {
    type: String,
    default: undefined,
  },
})

const style = computed(() => handleBackground(props.background))
</script>

<template>
  <div class="slidev-layout cover" :style="style">
    <div class="my-auto w-full">
      <slot />
    </div>
  </div>
</template>
