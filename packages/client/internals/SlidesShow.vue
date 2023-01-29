<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { clicks, currentRoute, isPresenter, nextRoute, rawRoutes } from '../logic/nav'
import { getSlideClass } from '../utils'
import { configs } from '../env'
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

const routes = computed(() => rawRoutes.filter(r => r.meta?.__preloaded || r === currentRoute.value))

const isLeaving = shallowRef<RouteRecordRaw | undefined>()
function onBeforeLeave(route: RouteRecordRaw) {
  if (configs.pageTransition.crossfade)
    return
  isLeaving.value = route
}
function onAfterLeave(route: RouteRecordRaw) {
  if (configs.pageTransition.crossfade)
    return
  if (isLeaving.value === route)
    isLeaving.value = undefined
}
</script>

<template>
  <!-- Global Bottom -->
  <GlobalBottom />

  <!-- Slides -->
  <template
    v-for="route of routes"
    :key="route.path"
  >
    <Transition
      v-bind="configs.pageTransition"
      @before-leave="onBeforeLeave(route)"
      @after-leave="onAfterLeave(route)"
    >
      <SlideWrapper
        :is="route?.component as any"
        v-show="route === currentRoute && !isLeaving"
        :clicks="route === currentRoute ? clicks : 0"
        :clicks-elements="route.meta?.__clicksElements || []"
        :clicks-disabled="false"
        :class="getSlideClass(route)"
        :route="route"
        :context="context"
      />
    </Transition>
  </template>

  <!-- Global Top -->
  <GlobalTop />

  <template v-if="(__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__) && DrawingLayer">
    <DrawingLayer />
  </template>
  <PresenterMouse v-if="!isPresenter" />
</template>
