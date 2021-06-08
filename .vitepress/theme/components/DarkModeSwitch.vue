<template>
  <button aria-label="Toggle Theme" class="nav-btn" @click="toggle">
    <ri-moon-fill v-show="isDark" />
    <ri-sun-fill v-show="!isDark" />
  </button>
</template>

<script setup lang='ts'>
import { useToggle } from '@vueuse/core'
import { isDark } from '../composables/dark'

const toggle = useToggle(isDark)
</script>
