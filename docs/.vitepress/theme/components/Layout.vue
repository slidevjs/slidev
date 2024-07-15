<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { computed } from 'vue'
import { useLocalStorage, useStyleTag } from '@vueuse/core'

const { Layout } = DefaultTheme

const showBanner = useLocalStorage('new-docs-banner', true)

useStyleTag(
  computed(() => showBanner.value
    ? `
:root {
  margin-top: 32px;
  transform: translateX(0);
}`
    : '',
  ),
)
</script>

<template>
  <div v-if="showBanner" class="fixed top--8 inset-x-0 h-8 text-center leading-8 bg-yellow-400 text-dark text-sm">
    Visit our brand new documentation
    <a href="https://deploy-preview-1736--slidev.netlify.app/" class="underline">here</a>,
    and let us know what you think on
    <a href="https://github.com/slidevjs/slidev/pull/1736" class="underline">PR #1736</a>
    <button class="absolute right-4 top-0 h-full flex items-center justify-center" @click="showBanner = false">
      <carbon:close />
    </button>
  </div>
  <Layout />
</template>
