<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { computed } from 'vue'
import { useNav } from '../composables/useNav'
import { useFixedClicks } from '../logic/clicks'
import PrintSlideClick from './PrintSlideClick.vue'

const props = defineProps<{ route: RouteRecordRaw }>()

const route = computed(() => props.route)
const nav = useNav(route)
const clicks0 = useFixedClicks(route.value, 0)[1]
</script>

<template>
  <PrintSlideClick
    :clicks="clicks0"
    :nav="nav"
    :route="route"
  />
  <template v-if="!clicks0.disabled">
    <PrintSlideClick v-for="i of clicks0.total" :key="i" :clicks="useFixedClicks(route, i)[1]" :nav="nav" :route="route" />
  </template>
</template>
