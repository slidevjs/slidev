<script setup lang="ts">
import { useFullscreen } from '@vueuse/core'
import { isDark, toggleDark, useNavigateControls } from '~/logic'

const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(document.body)
const { hasNext, hasPrev, prev, next } = useNavigateControls()
</script>

<template>
  <nav class="opacity-0 pb-4 pt-5 pl-6 pr-4 transition right-0 bottom-0 rounded-tl text-xl flex gap-4 text-gray-400 bg-transparent duration-300 fixed hover:(shadow bg-main opacity-100)">
    <button class="icon-btn" :class="{ disabled: !hasPrev }" @click="prev">
      <carbon:arrow-left />
    </button>

    <button class="icon-btn" :class="{ disabled: !hasNext }" @click="next">
      <carbon:arrow-right />
    </button>

    <button class="icon-btn" @click="toggleFullscreen">
      <carbon:minimize v-if="isFullscreen" />
      <carbon:maximize v-else />
    </button>

    <button class="icon-btn" @click="toggleDark">
      <carbon-moon v-if="isDark" />
      <carbon-sun v-else />
    </button>
  </nav>
</template>
