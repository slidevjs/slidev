<script setup lang="ts">
import { isDark } from '../logic/dark'
</script>

<template>
  <div>
    <slot v-if="isDark" name="dark" />
    <slot v-else name="light" />
  </div>
</template>
