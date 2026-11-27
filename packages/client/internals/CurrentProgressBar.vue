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
  <div class="relative flex gap-px">
    <div
      v-for="i of total - 1"
      :key="i" class="border-x border-b border-main h-4px transition-all"
      :style="{ width: `${(1 / (total - 1) * 100)}%` }"
      :class="i < current ? 'bg-primary border-primary' : ''"
    >
      <Transition name="fade">
        <div
          v-if="i === current"
          class="h-full bg-primary op75 transition-all"
          :style="{ width: `${clicksContext.total === 0 ? 0 : clicksContext.current / (clicksContext.total + 1) * 100}%` }"
        />
      </Transition>
    </div>
  </div>
</template>
