<script setup lang="ts">
import { watch } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { currentRoute, clicks, rawRoutes, nextRoute } from '../logic/nav'
import SlideWrapper from './SlideWrapper.vue'

// preload next route
watch(currentRoute, () => {
  if (currentRoute.value?.meta && currentRoute.value.meta.preload !== false)
    currentRoute.value.meta.__preloaded = true
  if (nextRoute.value?.meta && nextRoute.value.meta.preload !== false)
    nextRoute.value.meta.__preloaded = true
}, { immediate: true })

const getClass = (route: RouteRecordRaw) => {
  const no = route?.meta?.slide?.no
  if (no != null)
    return `slidev-page-${no}`
  return ''
}
</script>

<template>
  <template v-for="route of rawRoutes" :key="route.path">
    <SlideWrapper
      :is="route?.component"
      v-show="route === currentRoute"
      v-if="route.meta?.__preloaded || route === currentRoute"
      :clicks="route === currentRoute ? clicks : 0"
      :clicks-elements="route.meta?.__clicksElements || []"
      :clicks-disabled="false"
      :class="getClass(route)"
    />
  </template>
</template>
