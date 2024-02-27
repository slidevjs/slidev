<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { computed } from 'vue'
import { useNav } from '../composables/useNav'
import { useFixedClicks } from '../composables/useClicks'
import PrintSlideClick from './PrintSlideClick.vue'

const props = defineProps<{ route: RouteRecordRaw }>()

const route = computed(() => props.route)
const nav = useNav(route)
const clicks0 = useFixedClicks(route.value, 0)
</script>

<template>
  <PrintSlideClick
    :clicks-context="clicks0"
    :nav="nav"
    :route="route"
  />
  <template v-if="!clicks0.disabled">
    <PrintSlideClick
      v-for="i of clicks0.total"
      :key="i"
      :clicks-context="useFixedClicks(route, i)"
      :nav="nav"
      :route="route"
    />
  </template>
</template>
