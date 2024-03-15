<script setup lang="ts">
import type { SlideRoute } from '@slidev/types'
import { useFixedNav, useNav } from '../composables/useNav'
import { createFixedClicks } from '../composables/useClicks'
import { CLICKS_MAX } from '../constants'
import PrintSlideClick from './PrintSlideClick.vue'

const { route } = defineProps<{ route: SlideRoute }>()
const { isPrintWithClicks } = useNav()
const clicks0 = createFixedClicks(route, isPrintWithClicks.value ? 0 : CLICKS_MAX)
</script>

<template>
  <PrintSlideClick
    :clicks-context="clicks0"
    :nav="useFixedNav(route, clicks0)"
  />
  <template v-if="isPrintWithClicks">
    <PrintSlideClick
      v-for="i of clicks0.total"
      :key="i"
      :nav="useFixedNav(route, createFixedClicks(route, i))"
    />
  </template>
</template>
