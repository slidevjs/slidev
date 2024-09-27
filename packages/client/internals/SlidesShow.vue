<script setup lang="ts">
import type { SlideRoute } from '@slidev/types'
import { GlobalBottom, GlobalTop } from '#slidev/global-layers'
import { recomputeAllPoppers } from 'floating-vue'
import { computed, shallowRef, TransitionGroup, watchEffect } from 'vue'
import { createFixedClicks } from '../composables/useClicks'
import { useNav } from '../composables/useNav'
import { useViewTransition } from '../composables/useViewTransition'
import { CLICKS_MAX } from '../constants'
import { skipTransition } from '../logic/hmr'
import { activeDragElement } from '../state'
import DragControl from './DragControl.vue'
import SlideWrapper from './SlideWrapper.vue'

defineProps<{
  renderContext: 'slide' | 'presenter'
}>()

const {
  currentSlideRoute,
  currentTransition,
  getPrimaryClicks,
  prevRoute,
  nextRoute,
  slides,
  isPrintMode,
  isPrintWithClicks,
  clicksDirection,
} = useNav()

function preloadRoute(route: SlideRoute) {
  if (route.meta.preload !== false) {
    route.meta.__preloaded = true
    route.load()
  }
}
// preload current, prev and next slides
watchEffect(() => {
  preloadRoute(currentSlideRoute.value)
  preloadRoute(prevRoute.value)
  preloadRoute(nextRoute.value)
})
// preload all slides after 3s
watchEffect((onCleanup) => {
  const routes = slides.value
  const timeout = setTimeout(() => {
    routes.forEach(preloadRoute)
  }, 3000)
  onCleanup(() => clearTimeout(timeout))
})

const hasViewTransition = useViewTransition()

const DrawingLayer = shallowRef<any>()
if (__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__)
  import('./DrawingLayer.vue').then(v => DrawingLayer.value = v.default)

const loadedRoutes = computed(() => slides.value.filter(r => r.meta?.__preloaded || r === currentSlideRoute.value))

function onAfterLeave() {
  // After transition, we disable it so HMR won't trigger it again
  // We will turn it back on `nav.go` so the normal navigation would still work
  skipTransition.value = true
  // recompute poppers after transition
  recomputeAllPoppers()
}
</script>

<template>
  <!-- Global Bottom -->
  <GlobalBottom />

  <!-- Slides -->
  <component
    :is="hasViewTransition ? 'div' : TransitionGroup"
    v-bind="skipTransition ? {} : currentTransition"
    id="slideshow"
    tag="div"
    :class="{
      'slidev-nav-go-forward': clicksDirection > 0,
      'slidev-nav-go-backward': clicksDirection < 0,
    }"
    @after-leave="onAfterLeave"
  >
    <template v-for="route of loadedRoutes" :key="route.no">
      <SlideWrapper
        v-if="Math.abs(route.no - currentSlideRoute.no) <= 20"
        v-show="route === currentSlideRoute"
        :clicks-context="isPrintMode && !isPrintWithClicks ? createFixedClicks(route, CLICKS_MAX) : getPrimaryClicks(route)"
        :route="route"
        :render-context="renderContext"
      />
    </template>
  </component>

  <DragControl v-if="activeDragElement" :data="activeDragElement" />

  <!-- Global Top -->
  <GlobalTop />

  <template v-if="(__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__) && DrawingLayer">
    <DrawingLayer />
  </template>
</template>

<style scoped>
#slideshow {
  height: 100%;
}
</style>
