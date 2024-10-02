<script setup lang="ts">
import { computed } from 'vue'
import { community, official } from '../../addons'

const props = defineProps({
  collection: {
    default: 'official',
  },
})

const addons = computed(() => props.collection === 'official' ? official : community)
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    <AddonInfo v-for="addon of addons" :key="addon.id" :addon="addon" />
  </div>
</template>
