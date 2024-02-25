<script setup lang="ts">
import { TransitionGroup, computed, shallowRef, watch } from 'vue'
import { currentRoute, isPresenter, nextRoute, rawRoutes, transition } from '../logic/nav'
import { getSlideClass } from '../utils'
import { useViewTransition } from '../composables/useViewTransition'
import { skipTransition } from '../composables/hmr'
import { usePrimaryClicks } from '../composables/useClicks'
import SlideWrapper from './SlideWrapper'
import PresenterMouse from './PresenterMouse.vue'

import GlobalTop from '#slidev/global-components/top'
import GlobalBottom from '#slidev/global-components/bottom'

defineProps<{
  renderContext: 'slide' | 'presenter'
}>()

// preload next route
watch(currentRoute, () => {
  if (currentRoute.value?.meta && currentRoute.value.meta.preload !== false)
    currentRoute.value.meta.__preloaded = true
  if (nextRoute.value?.meta && nextRoute.value.meta.preload !== false)
    nextRoute.value.meta.__preloaded = true
}, { immediate: true })

const hasViewTransition = useViewTransition()

const DrawingLayer = shallowRef<any>()
if (__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__)
  import('./DrawingLayer.vue').then(v => DrawingLayer.value = v.default)

const loadedRoutes = computed(() => rawRoutes.filter(r => r.meta?.__preloaded || r === currentRoute.value))

function onAfterLeave() {
  // After transition, we disable it so HMR won't trigger it again
  // We will turn it back on `nav.go` so the normal navigation would still work
  skipTransition.value = true
}
</script>

<template>
  <!-- Global Bottom -->
  <GlobalBottom />

  <!-- Slides -->
  <component
    :is="hasViewTransition ? 'div' : TransitionGroup"
    v-bind="skipTransition ? {} : transition"
    id="slideshow"
    tag="div"
    @after-leave="onAfterLeave"
  >
    <template v-for="route of loadedRoutes" :key="route.path">
      <SlideWrapper
        :is="route?.component as any"
        v-show="route === currentRoute"
        :clicks-context="usePrimaryClicks(route)"
        :class="getSlideClass(route)"
        :route="route"
        :render-context="renderContext"
        class="overflow-hidden"
      />
    </template>
  </component>

  <!-- Global Top -->
  <GlobalTop />

  <template v-if="(__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__) && DrawingLayer">
    <DrawingLayer />
  </template>
  <PresenterMouse v-if="!isPresenter" />
</template>

<style scoped>
#slideshow {
  height: 100%;
}

#slideshow > div {
  position: absolute;
  height: 100%;
  width: 100%;
}
</style>
