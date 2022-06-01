<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { clicks, currentRoute, isPresenter, nextRoute, rawRoutes } from '../logic/nav'
import { getSlideClass } from '../utils'
import SlideWrapper from './SlideWrapper'
// @ts-expect-error virtual module
import GlobalTop from '/@slidev/global-components/top'
// @ts-expect-error virtual module
import GlobalBottom from '/@slidev/global-components/bottom'
import PresenterMouse from './PresenterMouse.vue'

defineProps<{ context: 'slide' | 'presenter' }>()

// preload next route
watch(currentRoute, () => {
  if (currentRoute.value?.meta && currentRoute.value.meta.preload !== false)
    currentRoute.value.meta.__preloaded = true
  if (nextRoute.value?.meta && nextRoute.value.meta.preload !== false)
    nextRoute.value.meta.__preloaded = true
}, { immediate: true })

const DrawingLayer = shallowRef<any>()
if (__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__)
  import('./DrawingLayer.vue').then(v => DrawingLayer.value = v.default)
</script>

<template>
  <!-- Global Bottom -->
  <GlobalBottom />

  <!-- Slides -->
  <template v-for="route of rawRoutes" :key="route.path">
    <SlideWrapper
      :is="route?.component"
      v-show="route === currentRoute"
      v-if="route.meta?.__preloaded || route === currentRoute"
      :clicks="route === currentRoute ? clicks : 0"
      :clicks-elements="route.meta?.__clicksElements || []"
      :clicks-disabled="false"
      :class="getSlideClass(route)"
      :route="route"
      :context="context"
    />
  </template>

  <!-- Global Top -->
  <GlobalTop />

  <template v-if="(__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__) && DrawingLayer">
    <DrawingLayer />
  </template>
  <PresenterMouse v-if="!isPresenter" />
</template>
