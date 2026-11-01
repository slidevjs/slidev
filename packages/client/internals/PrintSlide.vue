<script setup lang="ts">
import type { SlideRoute } from '@slidev/types'
import { createFixedClicks } from '../composables/useClicks'
import { useFixedNav } from '../composables/useNav'
import { usePrintClicks } from '../composables/usePrintClicks'
import PrintSlideClick from './PrintSlideClick.vue'

const { route } = defineProps<{ hidden?: boolean, route: SlideRoute }>()
const { clicks0, firstClick, extraClicks } = usePrintClicks(route)
</script>

<template>
  <PrintSlideClick
    v-if="firstClick !== null"
    v-show="!hidden"
    :nav="useFixedNav(route, clicks0)"
  />
  <PrintSlideClick
    v-for="i in extraClicks"
    v-show="!hidden"
    :key="i"
    :nav="useFixedNav(route, createFixedClicks(route, i))"
  />
</template>
