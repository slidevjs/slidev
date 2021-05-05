<script setup lang="ts">
import { defineProps } from 'vue'
import type { ThemeInfo } from '../../gallery'

defineProps<{
  theme: ThemeInfo
}>()
</script>

<template>
  <div>
    <a
      :href="theme.id ? theme.previews[0] : '/themes/write-a-theme#submit'"
      target="_blank"
      class="block mb-1.5 w-full overflow-hidden relative aspect-9/16"
      border="~ rounded gray-400 opacity-20"
    >
      <img :src="theme.previews[0]" class="absolute top-0 bottom-0 left-0 right-0" />
    </a>
    <div class="font-bold">
      {{ theme.name }}
    </div>
    <div
      class="text-current text-xs opacity-75 whitespace-nowrap overflow-hidden overflow-ellipsis"
    >
      {{ theme.description }}
    </div>
    <div class="mt-2 flex">
      <a
        v-if="theme.author.link"
        :href="theme.author.link"
        class="text-current text-sm opacity-50"
        target="_blank"
      >{{ theme.author.name }}</a>
      <div v-else class="text-current text-sm opacity-50">
        {{ theme.author.name }}
      </div>
      <div class="flex-auto"></div>
      <a
        v-if="theme.id"
        :href="`https://npmjs.com/package/${theme.id}`"
        class="ml-2 text-current opacity-20 text-sm"
        hover="opacity-100 text-[#cb3837]"
        target="_blank"
      >
        <simple-icons-npm />
      </a>
      <a
        v-if="theme.repo"
        :href="theme.repo"
        class="ml-2 text-current opacity-20 text-sm hover:opacity-100"
        target="_blank"
      >
        <simple-icons-github />
      </a>
    </div>
  </div>
</template>
