<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { computed, ref } from 'vue'
import { useNav } from '../composables/useNav'
import PrintSlideClick from './PrintSlideClick.vue'

const props = defineProps<{ route: RouteRecordRaw }>()

const clicksElements = ref(props.route.meta?.__clicksElements || [])

const route = computed(() => props.route)
const nav = useNav(route)
</script>

<template>
  <PrintSlideClick v-model:clicks-elements="clicksElements" :clicks="9999" :nav="nav" :route="route" />
</template>
