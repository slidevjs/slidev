<!--
A simple wrapper for embedded Tweet

Usage:

<Tweet id="20" />
-->

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { isDark } from '../logic/dark'

const props = defineProps<{
  id: string | number
  scale?: string | number
  conversation?: string
  cards?: 'hidden' | 'visible'
}>()

const tweet = ref<HTMLElement | null>()

const loaded = ref(false)
const tweetNotFound = ref(false)

async function create(retries = 10) {
  // @ts-expect-error global
  if (!window.twttr?.widgets?.createTweet) {
    if (retries <= 0)
      return console.error('Failed to load Twitter widget after 10 retries.')
    setTimeout(() => create(retries - 1), 1000)
    return
  }
  // @ts-expect-error global
  const element = await window.twttr.widgets.createTweet(
    props.id.toString(),
    tweet.value,
    {
      theme: isDark.value ? 'dark' : 'light',
      conversation: props.conversation || 'none',
      cards: props.cards,
    },
  )
  loaded.value = true
  if (element === undefined)
    tweetNotFound.value = true
}

onMounted(() => {
  create()
})
</script>

<template>
  <Transform :scale="scale || 1">
    <div ref="tweet" class="tweet slidev-tweet">
      <div v-if="!loaded || tweetNotFound" class="w-30 h-30 my-10px bg-gray-400 bg-opacity-10 rounded-lg flex opacity-50">
        <div class="m-auto animate-pulse text-4xl">
          <div class="i-carbon:logo-twitter" />
          <span v-if="tweetNotFound">Could not load tweet with id="{{ props.id }}"</span>
        </div>
      </div>
    </div>
  </Transform>
</template>

<style>
.slidev-tweet iframe {
  border-radius: 12px;
  overflow: hidden;
}
</style>
