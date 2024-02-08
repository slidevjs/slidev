<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { computed, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import type { ClicksFlow, ClicksMap } from '@slidev/types'
import { useNav } from '../composables/useNav'
import { isClicksDisabled } from '../logic/nav'
import PrintSlideClick from './PrintSlideClick.vue'

const props = defineProps<{ route: RouteRecordRaw }>()

const clicksFlow = ref(props.route.meta?.__clicksFlow ?? new Map()) as Ref<ClicksFlow>
const clicksMap = props.route.meta?.__clicksMap ?? reactive(new Map()) as ClicksMap

const route = computed(() => props.route)
const nav = useNav(route)
</script>

<template>
  <PrintSlideClick
    v-model:clicks-flow="clicksFlow"
    v-model:clicks-map="clicksMap"
    :clicks="0"
    :nav="nav"
    :route="route"
  />
  <template v-if="!isClicksDisabled">
    <PrintSlideClick v-for="i of nav.clicksTotal.value" :key="i" :clicks="i" :nav="nav" :route="route" />
  </template>
</template>
