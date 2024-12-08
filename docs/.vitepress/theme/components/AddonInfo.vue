<script setup lang="ts">
import type { AddonInfo } from '../../addons'

defineProps<{
  addon: AddonInfo
}>()
</script>

<template>
  <a :href="addon.link || addon.repo" class="block flex flex-col !decoration-none !text-unset !cursor-unset !hover:bg-gray-400/10 p-2 rounded-lg transition-all">
    <div class="flex flex-wrap">
      <a :href="addon.link || addon.repo" class="font-bold text-lg !text-$vp-c-text-1 !decoration-none">
        {{ addon.name }}
      </a>
      <div class="flex-grow" />
      <div class="mb-1 select-none op-80">
        <span v-for="tag in addon.tags" :key="tag" class="text-xs mx-.5 px-1.5 py-.5 rounded-lg bg-gray-400/40">
          {{ tag }}
        </span>
      </div>
    </div>
    <div
      class="flex-grow text-current text-xs opacity-90"
      :title="addon.description"
    >
      {{ addon.description }}
    </div>
    <div class="mt-2 flex">
      <a
        v-if="addon.author.link"
        :href="addon.author.link"
        class="text-current text-sm opacity-60 hover:opacity-100"
        target="_blank"
      >{{ addon.author.name }}</a>
      <div v-else class="text-current text-sm opacity-60 hover:opacity-100">
        {{ addon.author.name }}
      </div>
      <div class="flex-auto" />
      <a
        v-if="addon.id"
        :href="`https://npmjs.com/package/${addon.id}`"
        class="ml-2 text-current opacity-40 text-sm hover:opacity-100"
        target="_blank"
      >
        <simple-icons-npm />
      </a>
      <a
        v-if="addon.repo"
        :href="addon.repo"
        class="ml-2 text-current opacity-40 text-sm hover:opacity-100"
        target="_blank"
      >
        <simple-icons-github />
      </a>
    </div>
  </a>
</template>
