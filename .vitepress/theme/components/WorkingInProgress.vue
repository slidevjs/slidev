<script setup lang="ts">
import { useStorage } from '@vueuse/core'

const dismissed = useStorage('sldiev-docs-wip-dismissed', false)
</script>

<template>
  <div
    v-if="!dismissed"
    class="fixed top-15 lg:top-2 left-1/2 transform -translate-x-1/2 z-10 min-w-80 max-w-95vw lg:max-w-100"
    gap="2"
    flex="~"
    p="l-4 r-2 y-2"
    text="sm orange-600"
    bg="orange-100 opacity-90"
    dark:bg="[#3a281b]"
    border="~ orange-400 rounded-md"
  >
    <div class="m-auto">Slidev is still under heavy developement. API and usages are not set in stone yet.</div>
    <carbon:close
      class="cursor-pointer"
      text="3xl"
      hover:bg="orange-400 opacity-10"
      border="rounded"
      p="1"
      h="full"
      @click="dismissed = true"
    />
  </div>
</template>
