<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { computed, shallowRef } from 'vue'
import { slideHeight, slideWidth } from '../env'
import { getSlideClass } from '../utils'
import { clicks, currentRoute } from '../logic/nav'
import SlideWrapper from './SlideWrapper'
// @ts-expect-error virtual module
import GlobalTop from '/@slidev/global-components/top'
// @ts-expect-error virtual module
import GlobalBottom from '/@slidev/global-components/bottom'

defineProps<{ route: RouteRecordRaw }>()

const style = computed(() => ({
  height: `${slideHeight}px`,
  width: `${slideWidth}px`,
}))

const DrawingPreview = shallowRef<any>()
if (__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__)
  import('./DrawingPreview.vue').then(v => (DrawingPreview.value = v.default))
</script>

<template>
  <div :id="route.path" class="slide-container" :style="style">
    <GlobalBottom />

    <SlideWrapper
      :is="route?.component"
      :clicks="route === currentRoute ? clicks : 0"
      :clicks-elements="route.meta?.__clicksElements || []"
      :clicks-disabled="false"
      :class="getSlideClass(route)"
    />
    <template
      v-if="
        (__SLIDEV_FEATURE_DRAWINGS__ ||
          __SLIDEV_FEATURE_DRAWINGS_PERSIST__) &&
          DrawingPreview
      "
    >
      <DrawingPreview :page="+route.path" />
    </template>

    <GlobalTop />
  </div>
</template>
