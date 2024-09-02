---
editLink: false
footer: false
aside: false
outline: false
sidebar: false
pageClass: all-features-page
---

<script setup lang="ts">
import { useUrlSearchParams } from '@vueuse/core'
import { computed, toRef, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as features } from './index.data'

const query = useUrlSearchParams('hash-params', { removeFalsyValues: true })
const search = toRef(query, 'search') as Ref<string | null>
const tags = toRef(query, 'tags') as Ref<string | null>
const tagsArr = computed({
  get: () => tags.value?.toLowerCase().split(',').map(t => t.trim()).filter(Boolean) ?? [],
  set: (val: string[]) => query.tags = val.join(','),
})

const filteredFeatures = computed(() => {
  const s = search.value?.toLowerCase().trim()
  const t = tagsArr.value
  return Object.values(features).filter(feature => {
    return (!s || feature.title.toLowerCase().includes(s) || feature.description.toLowerCase().includes(s))
      && (!t?.length || t.every(tag => feature.tags?.includes(tag)))
  })
})

function resetFilters() {
  query.search = null
  query.tags = null
}

function removeTag(tag: string) {
  tagsArr.value = tagsArr.value.filter(t => t !== tag)
}
</script>

# Features

This is a list of all the individual features that Slidev provides. Each feature can be used independently and is optional.

You can also read <LinkInline link="guide/" /> to learn the features by topic.

<div flex items-center mt-6 gap-6>
  <div
    flex items-center rounded-md
    px3 py2 gap-2 border-2 border-solid border-transparent
    class="bg-$vp-c-bg-alt focus-within:border-color-$vp-c-brand"
  >
    <carbon:search text-sm op-80 />
    <input
      v-model="search"
      type="search" text-base
      placeholder="Search features..."
    />
  </div>
  <div
    v-if="tagsArr.length"
    flex items-center gap-1
  >
    <carbon:tag text-sm mr-1 op-80 />
    <FeatureTag v-for="tag in tagsArr" :key="tag" :tag removable @remove="removeTag(tag)"/>
  </div>
</div>

<FeaturesOverview :features="filteredFeatures" />

<div v-if="filteredFeatures.length === 0" class="w-full mt-6 op-80 flex flex-col items-center">
  No results found
  <button class="block select-button flex-inline gap-1 items-center px-2 py-1 hover:bg-gray-400/10 rounded" @click="resetFilters()">
    <carbon:filter-remove />
    Clear Filters
  </button>
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
