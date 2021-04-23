<template>
  <button aria-label="Toggle Theme" class="icon-button" @click="toggle">
    <carbon-moon v-show="isDark" />
    <carbon-sun v-show="!isDark" />
  </button>
</template>

<script setup lang='ts'>
import { useToggle } from '@vueuse/core'
import { isDark } from '../composables/dark'

const toggle = useToggle(isDark)
</script>
