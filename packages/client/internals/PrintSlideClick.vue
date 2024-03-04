<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { provideLocal } from '@vueuse/core'
import { injectionSlidevContext } from '../constants'
import { configs, slideHeight, slideWidth } from '../env'
import { getSlideClass } from '../utils'
import type { SlidevContextNav } from '../composables/useNav'
import SlideWrapper from './SlideWrapper.vue'

import GlobalTop from '#slidev/global-components/top'
import GlobalBottom from '#slidev/global-components/bottom'

const { nav } = defineProps<{
  nav: SlidevContextNav
}>()

const route = computed(() => nav.currentSlideRoute.value)

const style = computed(() => ({
  height: `${slideHeight.value}px`,
  width: `${slideWidth.value}px`,
}))

const DrawingPreview = shallowRef<any>()
if (__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__)
  import('./DrawingPreview.vue').then(v => (DrawingPreview.value = v.default))

const id = computed(() =>
  `${route.value.no.toString().padStart(3, '0')}-${(nav.clicks.value + 1).toString().padStart(2, '0')}`,
)

provideLocal(injectionSlidevContext, reactive({
  nav,
  configs,
  themeConfigs: computed(() => configs.themeConfig),
}))
</script>

<template>
  <div :id="id" class="print-slide-container" :style="style">
    <GlobalBottom />

    <SlideWrapper
      :is="route.component!"
      :clicks-context="nav.clicksContext.value"
      :class="getSlideClass(route)"
      :route="route"
    />
    <template
      v-if="
        (__SLIDEV_FEATURE_DRAWINGS__
          || __SLIDEV_FEATURE_DRAWINGS_PERSIST__)
          && DrawingPreview
      "
    >
      <DrawingPreview :page="route.no" />
    </template>

    <GlobalTop />
  </div>
</template>
