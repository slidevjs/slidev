<script setup lang="ts">
import { defineProps, computed } from 'vue'

const props = defineProps({
  background: {
    default: 'https://images.unsplash.com/photo-1504275107627-0c2ba7a43dba?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2167&q=80',
  },
})

const style = computed(() => ({
  backgroundImage: `linear-gradient(#0005, #0008), url(${props.background})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
}))
</script>

<template>
  <div
    class="layout-master cover text-white text-center"
    :style="style"
  >
    <div class="my-auto w-full">
      <slot />
    </div>
  </div>
</template>
