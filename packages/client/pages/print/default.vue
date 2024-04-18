<script setup lang="ts">
import { provideLocal } from '@vueuse/core'
import { computed, shallowRef } from 'vue'
import { injectionSlideScale } from '../../constants'
import { useSlidePageSize } from '../../composables/useSlidePageSize'
import { getSlideClass } from '../../utils'
import { slideHeight, slideWidth } from '../../env'
import PrintSlides from '../../internals/PrintSlides.vue'
import SlideWrapper from '../../internals/SlideWrapper.vue'

import GlobalTop from '#slidev/global-components/top'
import GlobalBottom from '#slidev/global-components/bottom'

useSlidePageSize()

provideLocal(injectionSlideScale, computed(() => 1))

function getElementId(no: number, clicks: number) {
  return `${no.toString().padStart(3, '0')}-${(clicks + 1).toString().padStart(2, '0')}`
}

const DrawingPreview = shallowRef<any>()
if (__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__)
  import('../../internals/DrawingPreview.vue').then(v => (DrawingPreview.value = v.default))
</script>

<template>
  <PrintSlides v-slot="{ nav, route }">
    <div :id="getElementId(route.no, nav.clicks.value + 1)" class="print-slide-container">
      <GlobalBottom />

      <SlideWrapper
        :is="route.component!"
        :clicks-context="nav.clicksContext.value"
        :class="getSlideClass(route)"
        :route="route"
      />
      <DrawingPreview
        v-if="DrawingPreview"
        :page="route.no"
      />

      <GlobalTop />
    </div>
  </PrintSlides>
</template>

<style scoped lang="postcss">
.print-slide-container {
  @apply relative overflow-hidden break-after-page translate-0;
  width: v-bind('`${slideWidth}px`');
  height: v-bind('`${slideHeight}px`');
}
</style>
