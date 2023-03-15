<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { computed, ref } from 'vue'
import { useNav } from '../composables/useNav'
import { isClicksDisabled } from '../logic/nav'
import PrintSlideClick from './PrintSlideClick.vue'

const props = defineProps<{ route: RouteRecordRaw }>()

const clicksElements = ref(props.route.meta?.__clicksElements || [])

const route = computed(() => props.route)
const nav = useNav(route)
</script>

<template>
  <PrintSlideClick v-model:clicks-elements="clicksElements" :clicks="0" :nav="nav" :route="route" />
  <template v-if="!isClicksDisabled">
    <PrintSlideClick v-for="i of (clicksElements.length)" :key="i" :clicks="i" :nav="nav" :route="route" />
  </template>
</template>
