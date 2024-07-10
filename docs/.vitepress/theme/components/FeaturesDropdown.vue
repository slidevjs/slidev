<script setup lang="ts">
import { data as features } from '../../../features/index.data'

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
  <div>
    <a href="/features/"> ✨ All Features </a>
  </div>
  <FeaturesOverview :features="Object.values(features).concat(allFeatures)" style="min-width: 50vw" @scroll.prevent />
</template>
