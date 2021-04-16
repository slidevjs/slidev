<script setup lang="ts">
import { defineProps, onMounted } from 'vue'
import { isDark } from '../logic'

defineProps<{
  url?: string
  scale?: string | number
}>()

onMounted(() => {
  // @ts-ignore
  window?.twttr.widgets.load()
})
</script>

<template>
  <Transform :scale="scale || 0.7" class="tweet">
    <blockquote class="twitter-tweet" :data-theme="isDark ? 'dark': 'light'">
      <slot>
        <a :href="url" />
      </slot>
    </blockquote>
  </Transform>
</template>

<style>
.tweet blockquote {
  opacity: 0;
}
</style>
