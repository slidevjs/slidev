<script setup lang="ts">
import { provideLocal } from '@vueuse/core'
import { computed, shallowRef } from 'vue'
import { injectionSlideScale } from '../../constants'
import { slideHeight, slideWidth } from '../../env'
import PrintSlides from '../../internals/PrintSlides.vue'
import SlideWrapper from '../../internals/SlideWrapper.vue'

import GlobalTop from '#slidev/global-components/top'
import GlobalBottom from '#slidev/global-components/bottom'

provideLocal(injectionSlideScale, computed(() => 1))

const DrawingPreview = shallowRef<any>()
if (__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__)
  import('../../internals/DrawingPreview.vue').then(v => (DrawingPreview.value = v.default))
</script>

<template>
  <PrintSlides v-slot="{ nav, route }">
    <div class="print-slide-container">
      <GlobalBottom />

      <SlideWrapper
        :is="route.component!"
        :clicks-context="nav.clicksContext.value"
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
@page {
  size: v-bind('`${slideWidth}px`') v-bind('`${slideHeight}px`');
  margin: 0;
}

.print-slide-container {
  @apply relative overflow-hidden break-before-page translate-0;
  width: v-bind('`${slideWidth}px`');
  height: v-bind('`${slideHeight}px`');
}
</style>
