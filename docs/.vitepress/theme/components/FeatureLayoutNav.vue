<script setup lang="ts">
import VPMenuGroup from 'vitepress/dist/client/theme-default/components/VPMenuGroup.vue'
import type { Feature } from '../../../features/index.data'

defineProps<{
  data: Feature
}>()
</script>

<template>
  <div flex flex-col flex-grow>
    <VPMenuGroup text="Back to" :items="[{ text: 'All features', link: '/features' }]" />
    <FeatureLayoutLinks name="Depends on" :links="data.depends" />
    <FeatureLayoutLinks name="Relates to" :links="data.relates" />
    <FeatureLayoutLinks name="Derives" :links="data.derives" />
    <FeatureLayoutSince :version="data.since" />
  </div>
</template>
