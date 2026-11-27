<script setup lang="ts">
import type { PropType } from 'vue'
import type { ImageForeground } from '../layoutHelper'
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
  imageForeground: {
    type: String as PropType<ImageForeground>,
    default: 'light',
    validator: (value: string) => ['light', 'dark'].includes(value),
  },
})

const style = computed(() => handleBackground(props.image, false, props.backgroundSize, props.imageForeground))
</script>

<template>
  <div class="slidev-layout w-full h-full" :style="style">
    <slot />
  </div>
</template>
