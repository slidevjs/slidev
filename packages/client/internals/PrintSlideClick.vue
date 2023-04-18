<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { computed, provide, reactive, shallowRef } from 'vue'
import { useVModel } from '@vueuse/core'
import { useNavClicks } from '../composables/useNavClicks'
import { injectionSlidevContext } from '../constants'
import { configs, slideHeight, slideWidth } from '../env'
import { getSlideClass } from '../utils'
import type { SlidevContextNav } from '../modules/context'
import SlideWrapper from './SlideWrapper'

// @ts-expect-error virtual module
import GlobalTop from '/@slidev/global-components/top'

// @ts-expect-error virtual module
import GlobalBottom from '/@slidev/global-components/bottom'

const props = defineProps<{
  clicks: number
  clicksElements?: HTMLElement[]
  nav: SlidevContextNav
  route: RouteRecordRaw
}>()

const emit = defineEmits(['update:clicksElements'])

const clicksElements = useVModel(props, 'clicksElements', emit)

const style = computed(() => ({
  height: `${slideHeight}px`,
  width: `${slideWidth}px`,
}))

const DrawingPreview = shallowRef<any>()
if (__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__)
  import('./DrawingPreview.vue').then(v => (DrawingPreview.value = v.default))

const clicks = computed(() => props.clicks)
const navClicks = useNavClicks(clicks, props.nav.currentRoute, props.nav.currentPage)
const id = computed(() => `${props.route.path.toString().padStart(3, '0')}-${(clicks.value + 1).toString().padStart(2, '0')}`)

provide(injectionSlidevContext, reactive({
  nav: { ...props.nav, ...navClicks },
  configs,
  themeConfigs: computed(() => configs.themeConfig),
}))
</script>

<template>
  <div :id="id" class="print-slide-container" :style="style">
    <GlobalBottom />

    <SlideWrapper
      :is="route?.component!"
      v-model:clicks-elements="clicksElements"
      :clicks="clicks"
      :clicks-disabled="false"
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
      <DrawingPreview :page="+route.path" />
    </template>

    <GlobalTop />
  </div>
</template>
