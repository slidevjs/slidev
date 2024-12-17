<script setup lang="ts">
import type { SlideRoute } from '@slidev/types'
import { createFixedClicks } from '../composables/useClicks'
import { useFixedNav, useNav } from '../composables/useNav'
import { CLICKS_MAX } from '../constants'
import PrintSlideClick from './PrintSlideClick.vue'

const { route } = defineProps<{ hidden?: boolean, route: SlideRoute }>()
const { isPrintWithClicks } = useNav()
const clicks0 = createFixedClicks(route, () => isPrintWithClicks.value ? 0 : CLICKS_MAX)
</script>

<template>
  <PrintSlideClick
    v-show="!hidden"
    :nav="useFixedNav(route, clicks0)"
  />
  <template v-if="isPrintWithClicks">
    <!--
      clicks0.total can be any number >=0 when rendering.
      So total-clicksStart can be negative in intermediate states.
    -->
    <PrintSlideClick
      v-for="i in Math.max(0, clicks0.total - clicks0.clicksStart)"
      v-show="!hidden"
      :key="i"
      :nav="useFixedNav(route, createFixedClicks(route, i + clicks0.clicksStart))"
    />
  </template>
</template>
