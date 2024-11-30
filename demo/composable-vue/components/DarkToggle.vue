<script setup lang="ts">
import { useDarkMode } from '@slidev/client'

const { isDark, toggleDark } = useDarkMode()
</script>

<template>
  <button
    class="bg-primary rounded border-b-2 border-green-900 text-sm px-2 pt-1.5 pb-1 inline-block !outline-none hover:bg-opacity-85"
    @click="toggleDark()"
  >
    <div class="flex">
      <div v-if="isDark" class="i-carbon:moon" />
      <div v-else class="i-carbon:sun" />
      <span class="mr-1 ml-2">{{ isDark ? 'Dark' : 'Light' }}</span>
    </div>
  </button>
</template>
