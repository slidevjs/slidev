<script setup lang="ts">
import { isDark } from '../logic/dark'
</script>

<template>
  <slot v-if="isDark" name="dark" />
  <slot v-else name="light" />
</template>
