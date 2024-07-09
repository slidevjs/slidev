---
editLink: false
footer: false
aside: false
outline: false
sidebar: false
---

<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as features } from './index.data'

const search = ref('')
const filteredFeatures = computed(() => {
  const s = search.value.toLowerCase().trim()
  if (!s) return features
  return Object.values(features).filter(feature => feature.title.toLowerCase().includes(s) || feature.description.toLowerCase().includes(s))
})
</script>

# Features

This is a list of all the individual features that Slidev provides. Each feature can be used independently and is optional.

You can also read <LinkInline link="guide/index" /> to learn the features by topic.

<div class="flex items-center mt-6 pl-1">
  <input v-model="search" type="search" placeholder="Search features..." class="input" />
</div>

<div class="features-grid mt-4">
  <a v-for="feature in filteredFeatures" :key="feature.id" :href="withBase(feature.link)">
    <div>
      <div font-bold text-wrap> {{ feature.title }} </div>
      <div h-20 text-wrap leading-5 op-80 pt-1 overflow-hidden text-sm> {{ feature.description }} </div>
    </div>
  </a>
</div>
<div v-if="filteredFeatures.length === 0" class="w-full text-center text-gray-500">
  No results found
</div>

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
  transition: background-color 0.25s, color 0.25s;
  background-color: var(--vp-c-default-soft);
}

.features-grid > a:hover {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-default-3);
}
</style>

<style>
.content {
  max-width: 72vw !important;
}
</style>

<style>
:root {
  overflow-y: scroll;
}
</style>
