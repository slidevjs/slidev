<script setup lang="ts">
import type { SlidevContextNav } from '../composables/useNav'
import { GlobalBottom, GlobalTop } from '#slidev/global-layers'
import { provideLocal } from '@vueuse/core'
import { computed, reactive, shallowRef, useTemplateRef } from 'vue'
import { injectionSlideElement, injectionSlidevContext } from '../constants'
import { configs, slideHeight, slideWidth } from '../env'
import { getSlideClass } from '../utils'
import SlideWrapper from './SlideWrapper.vue'

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

provideLocal(injectionSlideElement, useTemplateRef('slide-element'))
</script>

<template>
  <div :id="id" ref="slide-element" class="print-slide-container" :style="style">
    <GlobalBottom />

    <SlideWrapper
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

<style scoped lang="postcss">
.print-slide-container {
  @apply relative overflow-hidden break-after-page translate-0 bg-main;
}
</style>
