<script setup lang="ts">
import { computed } from 'vue'
import { community, official } from '../../themes'

const props = defineProps({
  collection: {
    default: 'official',
  },
})

const themes = computed(() => props.collection === 'official' ? official : community)
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    <ThemeInfo v-for="theme of themes" :key="theme.id" :theme="theme" />
  </div>
</template>
