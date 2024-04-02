<script setup lang="ts">
import { TransitionGroup, computed, shallowRef, watch } from 'vue'
import { recomputeAllPoppers } from 'floating-vue'
import { useNav } from '../composables/useNav'
import { useViewTransition } from '../composables/useViewTransition'
import { skipTransition } from '../logic/hmr'
import { createFixedClicks } from '../composables/useClicks'
import { CLICKS_MAX } from '../constants'
import SlideWrapper from './SlideWrapper.vue'
import PresenterMouse from './PresenterMouse.vue'

defineProps<{
  renderContext: 'slide' | 'presenter'
}>()

const {
  currentSlideRoute,
  currentTransition,
  getPrimaryClicks,
  isPresenter,
  nextRoute,
  slides,
  isPrintMode,
  isPrintWithClicks,
} = useNav()

// preload next route
watch(currentSlideRoute, () => {
  if (currentSlideRoute.value?.meta && currentSlideRoute.value.meta.preload !== false)
    currentSlideRoute.value.meta.__preloaded = true
  if (nextRoute.value?.meta && nextRoute.value.meta.preload !== false)
    nextRoute.value.meta.__preloaded = true
}, { immediate: true })

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
  <component
    :is="hasViewTransition ? 'div' : TransitionGroup"
    v-bind="skipTransition ? {} : currentTransition"
    id="slideshow"
    tag="div"
    @after-leave="onAfterLeave"
  >
    <div
      v-for="route of loadedRoutes"
      v-show="route === currentSlideRoute"
      :key="route.no"
    >
      <SlideWrapper
        :clicks-context="isPrintMode && !isPrintWithClicks ? createFixedClicks(route, CLICKS_MAX) : getPrimaryClicks(route)"
        :route="route"
        :render-context="renderContext"
      />
    </div>
  </component>

  <div id="twoslash-container" />

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
