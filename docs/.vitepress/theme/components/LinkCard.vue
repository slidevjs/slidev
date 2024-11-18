<script setup lang="ts">
import { withBase } from 'vitepress'
import { computed } from 'vue'
import { resolveLink } from '../../utils'

const props = defineProps<{
  link: string
}>()

const resolved = computed(() => resolveLink(props.link))
</script>

<template>
  <div class="sr-only">
    {{ resolved.title }}
  </div>
  <ClientOnly>
    <a class="link-card" :href="withBase(resolved.url)">
      <div class="title">
        <div>{{ resolved.title }}</div>
        <div flex-grow />
        <div flex gap-1>
          <FeatureTag v-for="tag in resolved.tags" :key="tag" :tag />
        </div>
      </div>
      <div class="description">
        {{ resolved.descripton }}
      </div>
    </a>
  </ClientOnly>
</template>

<style scoped>
.link-card {
  --uno: 'block my-4 pl-8 pr-6 py-6 rounded-lg bg-$vp-c-bg-soft flex flex-col gap-2';
  border: 2px solid var(--vp-c-bg-soft);
  transition:
    color 0.5s,
    background-color 0.5s;
  text-decoration: none;
}

.link-card:hover {
  border-color: var(--vp-c-brand-soft);
  transition: border-color 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.title {
  font-size: 18px;
  line-height: 1.4;
  letter-spacing: -0.02em;
  display: flex;
  color: var(--vp-c-brand-1);
}

.description {
  margin-bottom: 0;
  color: var(--vp-c-text-2);
  transition: color 0.5s;
}
</style>
