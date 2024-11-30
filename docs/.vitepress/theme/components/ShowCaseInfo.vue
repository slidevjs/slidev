<script setup lang="ts">
import type { ShowCaseInfo } from '../../showcases'

defineProps<{
  info: ShowCaseInfo
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="block w-full relative aspect-16/9">
      <a
        class="absolute top-0 bottom-0 left-0 right-0 overflow-hidden"
        border="~ rounded gray-400 opacity-20"
        :href="info.slidesLink"
        target="_blank"
      >
        <img :src="info.cover">
      </a>
    </div>
    <div class="font-bold line-clamp-2">
      {{ info.title }}
    </div>
    <div class="text-current text-xs opacity-75 whitespace-nowrap overflow-hidden overflow-ellipsis">
      {{ info.at }}
    </div>
    <div class="flex-auto" />
    <div class="flex">
      <a
        v-if="info.author.link"
        :href="info.author.link"
        class="text-current! text-sm opacity-50 whitespace-nowrap overflow-hidden overflow-ellipsis"
        target="_blank"
      >{{ info.author.name }}</a>
      <div v-else class="text-current! text-sm opacity-50 whitespace-nowrap overflow-hidden overflow-ellipsis">
        {{ info.author.name }}
      </div>
      <div class="flex-auto" />
      <a
        v-if="info.videoLink"
        :href="info.videoLink"
        class="ml-2 text-current! opacity-20 hover:opacity-100 hover:text-[#cb3837]"
        target="_blank"
      >
        <div class="i-carbon:video" />
      </a>
      <a
        v-if="info.slidesLink"
        :href="info.slidesLink"
        class="ml-2 text-current! opacity-20 hover:opacity-100 hover:text-[#cb3837]"
        target="_blank"
      >
        <div class="i-carbon:presentation-file" />
      </a>
      <a
        v-if="info.sourceLink"
        :href="info.sourceLink"
        class="ml-2 text-current! opacity-20 hover:opacity-100"
        target="_blank"
      >
        <div class="i-carbon:logo-github" />
      </a>
    </div>
  </div>
</template>
