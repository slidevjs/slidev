<script setup lang="ts">
import type { ThemeInfo } from '../../themes'
import { isClient, useIntervalFn } from '@vueuse/core'
import { ref } from 'vue'

const props = defineProps<{
  theme: ThemeInfo
}>()

const index = ref(0)

if (props.theme.previews.length > 1 && isClient) {
  const { resume } = useIntervalFn(() => {
    index.value = (index.value + 1) % props.theme.previews.length
  }, 3000, { immediate: false })
  // add random defer so they don't starts together
  setTimeout(resume, Math.round(1000 * Math.random()))
}
</script>

<template>
  <div>
    <a
      :href="theme.link || theme.repo"
      target="_blank"
      class="block mb-1.5 w-full overflow-hidden relative aspect-16/9 transition duration-300"
      border="~ rounded gray-400 opacity-20"
      hover="shadow-xl"
    >
      <img
        v-for="url, idx in theme.previews"
        :key="idx"
        :src="url"
        class="absolute top-0 bottom-0 left-0 right-0 transition-transform transform duration-500"
        :style="{ transform: idx > index ? 'scale(1.05) translate(110%)' : 'scale(1.05) translate(0)' }"
      >
    </a>
    <a :href="theme.link || theme.repo" class="font-bold !text-$vp-c-text-1 !decoration-none">
      {{ theme.name }}
    </a>
    <div
      class="text-current text-xs opacity-75 whitespace-nowrap overflow-hidden text-ellipsis"
      :title="theme.description"
    >
      {{ theme.description }}
    </div>
    <div class="mt-2 flex">
      <a
        v-if="theme.author.link"
        :href="theme.author.link"
        class="text-current text-sm opacity-60 hover:opacity-100"
        target="_blank"
      >{{ theme.author.name }}</a>
      <div v-else class="text-current text-sm opacity-60 hover:opacity-100">
        {{ theme.author.name }}
      </div>
      <div class="flex-auto" />
      <a
        v-if="theme.id"
        :href="`https://npmjs.com/package/${theme.id}`"
        class="ml-2 text-current opacity-40 text-sm hover:opacity-100"
        target="_blank"
      >
        <simple-icons-npm />
      </a>
      <a
        v-if="theme.repo"
        :href="theme.repo"
        class="ml-2 text-current opacity-40 text-sm hover:opacity-100"
        target="_blank"
      >
        <simple-icons-github />
      </a>
    </div>
  </div>
</template>
