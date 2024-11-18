<script setup lang="ts">
import type { Feature } from '../../../features/index.data'
import { withBase } from 'vitepress'

defineProps<{
  features: Feature[]
}>()
</script>

<template>
  <div class="features-grid mt-4">
    <a
      v-for="feature in features"
      :key="feature.name"
      flex flex-col h-full p4 gap-3 rounded-md
      :href="withBase(feature.link)"
    >
      <div font-bold text-wrap leading-5> {{ feature.title }} </div>
      <div text-wrap leading-5 op-75 overflow-hidden text-sm> {{ feature.description }} </div>
      <div flex-grow />
      <div flex gap-1 pointer-events-auto>
        <FeatureTag v-for="tag in feature.tags" :key="tag" :tag />
      </div>
    </a>
  </div>
</template>

<style scoped>
.features-grid {
  display: grid;
  grid-gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.features-grid > a {
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition:
    background-color 0.25s,
    color 0.25s;
  background-color: var(--vp-c-bg-soft);
}

.features-grid > a:hover {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-default-soft);
}
</style>
