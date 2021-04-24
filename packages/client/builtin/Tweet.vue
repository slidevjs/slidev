<script setup lang="ts">
import { defineProps, onMounted, ref } from 'vue'
import { isDark } from '../logic/dark'

const props = defineProps<{
  id: string | number
  scale?: string | number
}>()

const tweet = ref<HTMLElement | null>()

onMounted(() => {
  // @ts-ignore
  window?.twttr?.widgets?.createTweet(
    props.id.toString(),
    tweet.value,
    {
      theme: isDark.value ? 'dark' : 'light',
    },
  )
})
</script>

<template>
  <Transform :scale="scale || 1">
    <div ref="tweet"></div>
  </Transform>
</template>
