<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { computed, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import type { ClicksFlow, ClicksMaxMap } from '@slidev/types'
import { useNav } from '../composables/useNav'
import { isClicksDisabled } from '../logic/nav'
import PrintSlideClick from './PrintSlideClick.vue'

const props = defineProps<{ route: RouteRecordRaw }>()

const clicksFlow = ref(props.route.meta?.__clicksFlow ?? new Set()) as Ref<ClicksFlow>
const clicksMaxMap = props.route.meta?.__clicksMaxMap ?? reactive(new Map()) as ClicksMaxMap

const route = computed(() => props.route)
const nav = useNav(route)
</script>

<template>
  <PrintSlideClick
    v-model:clicks-flow="clicksFlow"
    v-model:clicks-max-map="clicksMaxMap"
    :clicks="0"
    :nav="nav"
    :route="route"
  />
  <template v-if="!isClicksDisabled">
    <PrintSlideClick v-for="i of nav.clicks" :key="i" :clicks="i" :nav="nav" :route="route" />
  </template>
</template>
