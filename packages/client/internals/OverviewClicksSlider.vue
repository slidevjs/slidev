<script setup lang="ts">
import type { ClicksContext } from '@slidev/types'
import type { Ref } from 'vue'
import { computed, defineProps } from 'vue'

const props = defineProps<{
  clickContext: [Ref<number>, ClicksContext]
}>()

const total = computed(() => props.clickContext[1].total)
const current = computed({
  get() {
    return props.clickContext[0].value > total.value ? -1 : props.clickContext[0].value
  },
  set(value: number) {
    // eslint-disable-next-line vue/no-mutating-props
    props.clickContext[0].value = value
  },
})

const range = computed(() => Array.from({ length: total.value + 1 }, (_, i) => i))
</script>

<template>
  <div
    class="flex gap-0.5 items-center select-none"
    :title="`Clicks in this slide: ${total}`"
  >
    <div class="flex gap-1 items-center min-w-16">
      <carbon:cursor-1 text-sm op50 />
      <span v-if="current <= total && current >= 0" text-primary>{{ current }}/</span>
      <span op50>{{ total }}</span>
    </div>
    <div
      relative flex-auto h5 flex="~"
      @dblclick="current = 999999"
    >
      <div
        v-for="i of range" :key="i"
        border="y main" of-hidden relative
        :class="[
          i === 0 ? 'rounded-l border-l' : '',
          i === total ? 'rounded-r border-r' : '',
        ]"
        :style="{ width: `${1 / total * 100}%` }"
      >
        <div absolute inset-0 z--1 :class=" i <= current ? 'bg-primary op20' : ''" />
        <div
          :class="[
            +i === +current ? 'text-primary font-bold op100 border-primary' : 'op30 border-main',
            i === 0 ? 'rounded-l' : '',
            i === total ? 'rounded-r' : 'border-r-2',
          ]"
          w-full h-full text-xs flex items-center justify-center
        >
          {{ i }}
        </div>
      </div>
      <input
        v-model="current"
        class="range" absolute inset-0
        type="range" :min="0" :max="total" :step="1" z-10 op0
        :style="{ '--thumb-width': `${1 / (total + 1) * 100}%` }"
      >
    </div>
  </div>
</template>

<style scoped>
.range {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}
.range::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 100%;
  width: var(--thumb-width, 0.5rem);
}

.range::-moz-range-thumb {
  height: 100%;
  width: var(--thumb-width, 0.5rem);
}
</style>
