---
editLink: false
footer: false
aside: false
outline: false
sidebar: false
pageClass: all-features-page
---

<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as features } from './index.data'

const search = ref('')
const filteredFeatures = computed(() => {
  const s = search.value.toLowerCase().trim()
  if (!s) return Object.values(features)
  return Object.values(features).filter(feature => feature.title.toLowerCase().includes(s) || feature.description.toLowerCase().includes(s))
})
</script>

# Features

This is a list of all the individual features that Slidev provides. Each feature can be used independently and is optional.

You can also read <LinkInline link="guide/index" /> to learn the features by topic.

<div class="flex items-center mt-6 pl-1">
  <carbon:search text-sm mr-2 op-80 />
  <input v-model="search" type="search" placeholder="Search features..." class="input" />
</div>

<FeaturesOverview :features="filteredFeatures" />
<div v-if="filteredFeatures.length === 0" class="w-full text-center text-gray-500">
  No results found
</div>

<style>
.all-features-page .VPDoc > .container > .content {
  max-width: 72vw !important;
}
</style>

<style>
:root {
  overflow-y: scroll;
}
</style>
