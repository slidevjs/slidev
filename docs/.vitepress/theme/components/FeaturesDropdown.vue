<script setup lang="ts">
import VPMenuLink from 'vitepress/dist/client/theme-default/components/VPMenuLink.vue'
import { data as features } from '../../../features/index.data'

defineProps<{
  screenMenu: boolean
}>()

const allFeatures = {
  name: 'all',
  title: '✨ All Features',
  link: '/features/',
  description: 'View all features in the documentation',
  depends: [],
  relates: [],
  derives: [],
}
</script>

<template>
  <VPMenuLink :item="{ text: '✨ All Features', link: '/features/' }" />
  <template v-if="screenMenu">
    <VPMenuLink v-for="feature in Object.values(features)" :key="feature.name" :item="{ text: feature.title, link: feature.link }" />
  </template>
  <FeaturesOverview v-else :features="Object.values(features).concat(allFeatures)" class="features" />
</template>

<style scoped>
.features {
  width: 710px;
}

@media (max-width: 1050px) {
  .features {
    width: 470px;
  }
}
</style>
