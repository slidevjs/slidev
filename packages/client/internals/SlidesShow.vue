<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { clicks, currentRoute, isPresenter, nextRoute, rawRoutes, router, transition } from '../logic/nav'
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

const isViewTransition = ref(false);
(() => {
  let finishTransition: undefined | (() => void)
  let abortTransition: undefined | (() => void)
  const supportViewTransition = typeof document !== 'undefined' && 'startViewTransition' in document

  router.beforeResolve((from, to) => {
    if (supportViewTransition && (from.meta.transition === 'view-transition' || to.meta.transition === 'view-transition')) {
      isViewTransition.value = true
      const promise = new Promise<void>((resolve, reject) => {
        finishTransition = resolve
        abortTransition = reject
      })

      let changeRoute: () => void
      const ready = new Promise<void>(resolve => (changeRoute = resolve))

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const transition = document.startViewTransition(() => {
        changeRoute()
        return promise
      })

      transition.finished.then(() => {
        abortTransition = undefined
        finishTransition = undefined
      })
      return ready
    }
    else {
      isViewTransition.value = false
    }
  })

  router.afterEach(() => {
    if (finishTransition)
      finishTransition()
    if (abortTransition)
      abortTransition()
  })
})()

// preserve the clicks count for previous slide to avoid flash on transition
let previousClicks: [string | undefined, number] = [] as any
router.beforeEach(() => {
  previousClicks = [currentRoute.value?.path, clicks.value]
})

const DrawingLayer = shallowRef<any>()
if (__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__)
  import('./DrawingLayer.vue').then(v => DrawingLayer.value = v.default)

const loadedRoutes = computed(() => rawRoutes.filter(r => r.meta?.__preloaded || r === currentRoute.value))
</script>

<template>
  <!-- Global Bottom -->
  <GlobalBottom />

  <!-- Slides -->
  <TransitionGroup v-if="!isViewTransition" v-bind="transition" id="slideshow" tag="div">
    <template v-for="route of loadedRoutes" :key="route.path">
      <SlideWrapper
        :is="route?.component as any" v-show="route === currentRoute"
        :clicks="route === currentRoute ? clicks : route.path === previousClicks[0] ? previousClicks[1] : 0"
        :clicks-elements="route.meta?.__clicksElements || []" :clicks-disabled="false" :class="getSlideClass(route)"
        :route="route" :context="context"
      />
    </template>
  </TransitionGroup>
  <template v-for="route of loadedRoutes" v-else :key="route.path">
    <SlideWrapper
      :is="route?.component as any" v-show="route === currentRoute"
      :clicks="route === currentRoute ? clicks : route.path === previousClicks[0] ? previousClicks[1] : 0"
      :clicks-elements="route.meta?.__clicksElements || []" :clicks-disabled="false" :class="getSlideClass(route)"
      :route="route" :context="context"
    />
  </template>
  <!-- Global Top -->
  <GlobalTop />

  <template v-if="(__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__) && DrawingLayer">
    <DrawingLayer />
  </template>
  <PresenterMouse v-if="!isPresenter" />
</template>

<style scoped>
#slideshow {
  @apply h-full;
}

#slideshow > div {
  @apply h-full w-full absolute;
}
</style>
