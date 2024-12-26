<script setup lang="ts">
import { useFocus } from '@vueuse/core'

const inFocus = useFocus(document.body)
</script>

<template>
  <div class="slidev-focus-indicator" :class="{ 'slidev-focus-indicator-active': inFocus }" />
</template>
