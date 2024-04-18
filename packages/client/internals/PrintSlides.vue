<script setup lang="ts">
import { computed, defineComponent, provide, reactive } from 'vue'
import type { SlidevContextNav } from '../composables/useNav'
import { useFixedNav, useNav } from '../composables/useNav'
import { createFixedClicks } from '../composables/useClicks'
import { CLICKS_MAX, injectionSlidevContext } from '../constants'
import { configs } from '../env'

const { slidesToPrint, isPrintWithClicks } = useNav()
const clicks0 = computed(() =>
  slidesToPrint.value.map(route => createFixedClicks(route, isPrintWithClicks.value ? 0 : CLICKS_MAX)),
)

const ProvideSlidevContext = defineComponent<{
  nav: SlidevContextNav
}>(({ nav }, { slots }) => {
  provide(injectionSlidevContext, reactive({
    nav,
    configs,
    themeConfigs: computed(() => configs.themeConfig),
  }))
  return () => slots?.default?.({ nav, clicks0 })
}, {
  props: ['nav'],
})
</script>

<template>
  <template v-for="(route, i) of slidesToPrint" :key="route.no">
    <ProvideSlidevContext v-slot="{ nav }" :nav="useFixedNav(route, clicks0[i])">
      <slot :route="route" :nav="nav" />
    </ProvideSlidevContext>
    <template v-if="isPrintWithClicks">
      <!--
        clicks0.total can be any number >=0 when rendering.
        So total-clicksStart can be negative in intermediate states.
      -->
      <ProvideSlidevContext
        v-for="click in Math.max(0, clicks0[i].total - clicks0[i].clicksStart)"
        :key="click" v-slot="{ nav }"
        :nav="useFixedNav(route, createFixedClicks(route, click + clicks0[i].clicksStart))"
      >
        <slot :route="route" :nav="nav" />
      </ProvideSlidevContext>
    </template>
  </template>
</template>
