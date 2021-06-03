<script setup lang="ts">
import { watch } from 'vue'
import { currentRoute, clicks, rawRoutes, nextRoute } from '../logic/nav'
import { getSlideClass } from '../utils'
import SlideWrapper from './SlideWrapper'
// @ts-ignore
import GlobalTop from '/@slidev/global-components/top'
// @ts-ignore
import GlobalBottom from '/@slidev/global-components/bottom'

// preload next route
watch(currentRoute, () => {
  if (currentRoute.value?.meta && currentRoute.value.meta.preload !== false)
    currentRoute.value.meta.__preloaded = true
  if (nextRoute.value?.meta && nextRoute.value.meta.preload !== false)
    nextRoute.value.meta.__preloaded = true
}, { immediate: true })
</script>

<template>
  <!-- Global Bottom -->
  <SlideWrapper>
    <div class="slidev-global-bottom -z-1 absolute top-0 left-0 bottom-0 right-0 w-full h-full">
      <GlobalBottom />
    </div>
  </SlideWrapper>

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
    />
  </template>

  <!-- Global Top -->
  <SlideWrapper>
    <div class="slidev-global-top absolute top-0 left-0 bottom-0 right-0 w-full h-full">
      <GlobalTop />
    </div>
  </SlideWrapper>
</template>
