<script setup lang="ts">
import { useWindowFocus } from '@vueuse/core'

const inFocus = useWindowFocus()
</script>

<template>
  <div class="slidev-focus-indicator" :class="{ 'slidev-focus-indicator-active': inFocus }" />
</template>
