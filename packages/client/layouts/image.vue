<script setup lang="ts">
import type { PropType } from 'vue'
import type { BackgroundText } from '../layoutHelper'
import { computed } from 'vue'
import { handleBackground } from '../layoutHelper'

const props = defineProps({
  image: {
    type: String,
  },
  backgroundSize: {
    type: String,
    default: 'cover',
  },
  text: {
    type: String as PropType<BackgroundText>,
    default: 'light',
    validator: (value: string) => ['light', 'dark'].includes(value),
  },
})

const style = computed(() => handleBackground(props.image, false, props.backgroundSize, props.text))
</script>

<template>
  <div class="slidev-layout w-full h-full" :style="style">
    <slot />
  </div>
</template>
