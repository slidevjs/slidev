<script setup lang="ts">
import { withBase } from 'vitepress'
import type { Feature } from '../../../features/index.data'

defineProps<{
  features: Feature[]
}>()
</script>

<template>
  <div class="features-grid mt-4">
    <a v-for="feature in features" :key="feature.name" :href="withBase(feature.link)">
      <div>
        <div font-bold text-wrap leading-5 my-2> {{ feature.title }} </div>
        <div h-20 text-wrap leading-5 op-80 pt-1 overflow-hidden text-sm> {{ feature.description }} </div>
      </div>
    </a>
  </div>
</template>

<style scoped>
.features-grid {
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.features-grid > a {
  display: block;
  border-radius: 6px;
  padding: 6px 12px;
  line-height: 32px;
  font-size: 16px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  text-decoration: none;
  transition:
    background-color 0.25s,
    color 0.25s;
  background-color: var(--vp-c-default-soft);
}

.features-grid > a:hover {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-default-3);
}
</style>
