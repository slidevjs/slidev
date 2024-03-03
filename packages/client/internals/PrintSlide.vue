<script setup lang="ts">
import type { SlideRoute } from '@slidev/types'
import { useFixedNav } from '../composables/useNav'
import { useFixedClicks } from '../composables/useClicks'
import PrintSlideClick from './PrintSlideClick.vue'

const { route } = defineProps<{ route: SlideRoute }>()
const clicks0 = useFixedClicks(route, 0)
</script>

<template>
  <PrintSlideClick
    :clicks-context="clicks0"
    :nav="useFixedNav(route, clicks0)"
  />
  <template v-if="!clicks0.disabled">
    <PrintSlideClick
      v-for="i of clicks0.total"
      :key="i"
      :nav="useFixedNav(route, useFixedClicks(route, i))"
    />
  </template>
</template>
