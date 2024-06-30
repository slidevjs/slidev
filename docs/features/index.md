---
editLink: false
footer: false
aside: false
outline: false
sidebar: false
---

<script setup lang="ts">
import { withBase } from 'vitepress'
import { data as features } from './index.data'
</script>

# Features

<div class="features-grid mt-6">
  <a v-for="feature in features" :key="feature.id" :href="withBase(feature.link)">
    <div>
      <div font-bold > {{ feature.title }} </div>
      <div h-20 text-wrap leading-5 op-80 pt-1 overflow-hidden text-sm> {{ feature.description }} </div>
    </div>
  </a>
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
