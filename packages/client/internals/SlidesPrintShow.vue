<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { recomputeAllPoppers } from 'floating-vue'
import { useNav } from '../composables/useNav'
import { createFixedClicks } from '../composables/useClicks'
import { CLICKS_MAX } from '../constants'
import SlideWrapper from './SlideWrapper.vue'

import GlobalTop from '#slidev/global-components/top'
import GlobalBottom from '#slidev/global-components/bottom'

const { isPrintWithClicks, slidesToPrint, currentSlideNo, currentSlideRoute, getPrimaryClicks } = useNav()

watch(currentSlideRoute, () => {
  setTimeout(recomputeAllPoppers, 100)
}, { immediate: true })

const DrawingPreview = shallowRef<any>()
if (__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__)
  import('./DrawingPreview.vue').then(v => (DrawingPreview.value = v.default))
</script>

<template>
  <GlobalBottom />
  <template v-for="route of slidesToPrint" :key="route.no">
    <SlideWrapper
      v-if="route.no >= currentSlideNo && route.no < currentSlideNo + 2"
      v-show="route === currentSlideRoute"
      :clicks-context="isPrintWithClicks ? getPrimaryClicks(route) : createFixedClicks(route, CLICKS_MAX)"
      :route="route"
    />
  </template>
  <DrawingPreview v-if="DrawingPreview" :page="currentSlideNo" />
  <GlobalTop />
</template>
