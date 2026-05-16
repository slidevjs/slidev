<script setup lang="ts">
import type { SlideRoute } from '@slidev/types'
import { createFixedClicks } from '../composables/useClicks'
import { useFixedNav, useNav } from '../composables/useNav'
import { CLICKS_MAX } from '../constants'
import PrintSlideClick from './PrintSlideClick.vue'

const { route, hidden } = defineProps<{ hidden?: boolean, route: SlideRoute }>()
const { isPrintWithClicks } = useNav()

// Snapshot the value ONCE at component setup time. The upstream code used a
// reactive getter here, which on initial hydration could resolve to CLICKS_MAX
// before useNav had finished initialising isPrintWithClicks — producing the
// "final state appears as the first exported page" bug reported in #2034.
// Reading .value once captures a stable Number.
const initialClicks = isPrintWithClicks.value ? 0 : CLICKS_MAX
const clicksRef = createFixedClicks(route, initialClicks)
</script>

<template>
  <!--
    Always-on instance. Two roles:
      1. Renders state `clicksStart` in with-clicks mode (the empty/initial
         state) or `CLICKS_MAX` in non-clicks mode (the final-state preview).
      2. Its rendered slide component injects `clicksRef` and calls
         `clicksRef.setup()` (injected by the slidev layout wrapper). When the
         slide mounts, `clicksRef.isMounted` flips true and `maxMap` becomes
         shallowReactive — which makes `clicksRef.total` accurate for the
         v-for below.
  -->
  <PrintSlideClick
    v-show="!hidden"
    :nav="useFixedNav(route, clicksRef)"
  />
  <template v-if="isPrintWithClicks">
    <PrintSlideClick
      v-for="i in Math.max(0, clicksRef.total - clicksRef.clicksStart)"
      v-show="!hidden"
      :key="i + clicksRef.clicksStart"
      :nav="useFixedNav(route, createFixedClicks(route, i + clicksRef.clicksStart))"
    />
  </template>
</template>
