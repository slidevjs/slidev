<script setup lang="ts">
import { useScriptTag } from '@vueuse/core'
import { defineProps, getCurrentInstance, onMounted, ref } from 'vue'
import { isDark } from '../logic/dark'

const props = defineProps<{
  id: string | number
  scale?: string | number
  conversation?: string
}>()

const tweet = ref<HTMLElement | null>()

const vm = getCurrentInstance()!

function create() {
  // @ts-ignore
  window?.twttr?.widgets?.createTweet(
    props.id.toString(),
    tweet.value,
    {
      theme: isDark.value ? 'dark' : 'light',
      conversation: props.conversation || 'none',
    },
  )
}

useScriptTag(
  'https://platform.twitter.com/widgets.js',
  () => {
    if (vm.isMounted)
      create()
    else
      onMounted(create, vm)
  },
  { async: true },
)
</script>

<template>
  <Transform :scale="scale || 1">
    <div ref="tweet"></div>
  </Transform>
</template>
