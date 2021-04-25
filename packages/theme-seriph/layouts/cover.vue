<script setup lang="ts">
import { defineProps, computed } from 'vue'

const props = defineProps({
  background: {
    // random image from a curated Unsplash collection by Anthony
    default: 'https://source.unsplash.com/collection/94734566/1920x1080',
  },
})

const style = computed(() => ({
  background: !props.background && 'white',
  color: props.background && 'white',
  backgroundImage: props.background && `linear-gradient(#0005, #0008), url(${props.background})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
}) as any)
</script>

<template>
  <div
    class="layout-master cover text-center"
    :style="style"
  >
    <div class="my-auto w-full">
      <slot />
    </div>
  </div>
</template>
