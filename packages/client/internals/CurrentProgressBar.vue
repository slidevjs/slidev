<script setup lang="ts">
import type { ClicksContext } from '@slidev/types'
import { computed } from 'vue'
import { useNav } from '../composables/useNav'

const props = defineProps<{
  clicksContext?: ClicksContext
  current?: number
}>()

const nav = useNav()
const clicksContext = computed(() => props.clicksContext ?? nav.clicksContext.value)
const current = computed(() => props.current ?? nav.currentSlideNo.value)
const { total } = nav
</script>

<template>
  <div class="border-b border-main relative flex">
    <div
      v-for="i of total"
      :key="i" class="absolute top-0 bottom-0 border-r border-main w-px"
      :style="{ left: `${(i - 1) / (total - 1) * 100}%` }"
    />
    <div
      class="h-5px bg-primary transition-all"
      :style="{ width: `${(current - 1) / (total - 1) * 100}%` }"
    />
    <div
      class="h-5px bg-primary op50 transition-all"
      :style="{ width: `${clicksContext.total === 0 ? 0 : clicksContext.current / (clicksContext.total + 1) * (1 / (total - 1)) * 100}%` }"
    />
  </div>
</template>
