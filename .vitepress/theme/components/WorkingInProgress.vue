<script setup lang="ts">
import { useStorage } from '@vueuse/core'

const dismissed = useStorage('sldiev-docs-wip-dismissed', false)
</script>

<template>
  <div
    v-if="!dismissed"
    class="fixed top-15 lg:top-2 left-1/2 transform -translate-x-1/2 z-10 w-9/10 md:w-100 backdrop-filter backdrop-blur-sm"
    gap="2"
    flex="~"
    p="l-4 r-2 y-2"
    text="sm orange-500 dark:orange-400"
    bg="orange-100 opacity-80"
    dark:bg="[#3a281b]"
    border="~ orange-400 rounded-md"
  >
    <div class="m-auto">
      Slidev is still under heavy developement. API and usages are not set in stone yet.
    </div>
    <div
      class="cursor-pointer"
      text="xl"
      border="rounded"
      p="1"
      flex="~"
      opacity="50 hover:100"
      hover:bg="orange-400 opacity-10"
      @click="dismissed = true"
    >
      <carbon:checkmark class="m-auto" />
    </div>
  </div>
</template>
