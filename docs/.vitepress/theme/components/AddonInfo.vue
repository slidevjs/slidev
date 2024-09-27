<script setup lang="ts">
import type { AddonInfo } from '../../addons'

defineProps<{
  addon: AddonInfo
}>()
</script>

<template>
  <div>
    <a :href="addon.link || addon.repo" class="font-bold !text-$vp-c-text-1 !decoration-none">
      {{ addon.name }}
    </a>
    <div
      class="text-current text-xs opacity-75 whitespace-nowrap overflow-hidden text-ellipsis"
      :title="addon.description"
    >
      {{ addon.description }}
    </div>
    <div class=" flex">
      <a
        v-if="addon.author.link"
        :href="addon.author.link"
        class="text-current text-sm opacity-50"
        target="_blank"
      >{{ addon.author.name }}</a>
      <div v-else class="text-current text-sm opacity-50">
        {{ addon.author.name }}
      </div>
      <div class="flex-auto" />
      <a
        v-if="addon.id"
        :href="`https://npmjs.com/package/${addon.id}`"
        class="ml-2 text-current opacity-20 text-sm"
        hover="opacity-100 text-[#cb3837]"
        target="_blank"
      >
        <simple-icons-npm />
      </a>
      <a
        v-if="addon.repo"
        :href="addon.repo"
        class="ml-2 text-current opacity-20 text-sm hover:opacity-100"
        target="_blank"
      >
        <simple-icons-github />
      </a>
    </div>
  </div>
</template>
