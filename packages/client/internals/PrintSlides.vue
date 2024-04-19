<script setup lang="ts">
import { computed, defineComponent, provide, reactive } from 'vue'
import { useFixedNav, useNav } from '../composables/useNav'
import { createFixedClicks } from '../composables/useClicks'
import { CLICKS_MAX, injectionSlidevContext } from '../constants'
import { configs } from '../env'

const globalNav = useNav()
const { slidesToPrint, isPrintWithClicks, isPrintPerSlide, currentSlideNo, currentSlideRoute } = globalNav
const clicks0 = computed(() =>
  slidesToPrint.value.map(route => createFixedClicks(route, isPrintWithClicks.value ? 0 : CLICKS_MAX)),
)

const ProvideSlidevContext = defineComponent(({ scopedNav: nav }, { slots }) => {
  provide(injectionSlidevContext, reactive({
    nav,
    configs,
    themeConfigs: computed(() => configs.themeConfig),
  }))
  return () => slots?.default?.({ nav, clicks0 })
}, {
  props: ['scopedNav'],
})
</script>

<template>
  <template v-if="isPrintPerSlide">
    <slot :key="currentSlideNo" :route="currentSlideRoute" :nav="globalNav" />
  </template>
  <template v-for="(route, i) of slidesToPrint" v-else :key="route.no">
    <ProvideSlidevContext v-slot="{ nav }" :scoped-nav="useFixedNav(route, clicks0[i])">
      <slot :route :nav />
    </ProvideSlidevContext>
    <template v-if="isPrintWithClicks">
      <ProvideSlidevContext
        v-for="click in Math.max(0, clicks0[i].total - clicks0[i].clicksStart)"
        :key="click" v-slot="{ nav }"
        :scoped-nav="useFixedNav(route, createFixedClicks(route, click + clicks0[i].clicksStart))"
      >
        <slot :route :nav />
      </ProvideSlidevContext>
    </template>
  </template>
</template>
