<!--
A simple wrapper for embedded Tweet

Usage:

<TheTweet id="20" />
-->

<script setup lang="ts">
import { isClient, useScriptTag } from '@vueuse/core'
import { getCurrentInstance, onMounted, ref } from 'vue'
import { isDark } from '../composables/dark'

const props = defineProps<{
  id: string | number
  scale?: string | number
  conversation?: string
}>()

const tweet = ref<HTMLElement | null>()

const vm = getCurrentInstance()!
const loaded = ref(false)

async function create() {
  // @ts-expect-error Global variable
  if (!window.twttr?.widgets?.createTweet)
    return
  // @ts-expect-error Global variable
  await window.twttr.widgets.createTweet(
    props.id.toString(),
    tweet.value,
    {
      theme: isDark.value ? 'dark' : 'light',
      conversation: props.conversation || 'none',
    },
  )
  loaded.value = true
}

if (isClient) {
  // @ts-expect-error Global variable
  if (window?.twttr?.widgets?.createTweet) {
    onMounted(create)
  }
  else {
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
  }
}
</script>

<template>
  <div class="w-full flex">
    <div ref="tweet" class="mx-auto w-140">
      <div v-if="!loaded" class="w-30 h-30 my-10px bg-gray-400 bg-opacity-10 rounded-lg flex opacity-50">
        <div class="m-auto animate-pulse text-4xl">
          <carbon:logo-twitter />
        </div>
      </div>
    </div>
  </div>
</template>
