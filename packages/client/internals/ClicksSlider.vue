<script setup lang="ts">
import type { ClicksContext } from '@slidev/types'
import { clamp, range } from '@antfu/utils'
import { computed } from 'vue'
import { CLICKS_MAX } from '../constants'

const props = defineProps<{
  clicksContext: ClicksContext
}>()

const total = computed(() => props.clicksContext.total)
const start = computed(() => clamp(0, props.clicksContext.clicksStart, total.value))
const length = computed(() => total.value - start.value + 1)
const current = computed({
  get() {
    return props.clicksContext.current > total.value ? -1 : props.clicksContext.current
  },
  set(value: number) {
    // eslint-disable-next-line vue/no-mutating-props
    props.clicksContext.current = value
  },
})

const clicksRange = computed(() => range(start.value, total.value + 1))

function onMousedown() {
  if (current.value < 0 || current.value > total.value)
    current.value = 0
}
</script>

<template>
  <div
    class="flex gap-1 items-center select-none"
    :title="`Clicks in this slide: ${length}`"
    :class="length ? '' : 'op50'"
  >
    <div class="flex gap-0.5 items-center min-w-16 font-mono mr1">
      <carbon:cursor-1 text-sm op50 />
      <div flex-auto />
      <template v-if="current >= 0 && current !== CLICKS_MAX">
        <span text-primary>{{ current }}</span>
        <span op25>/</span>
      </template>
      <span op50>{{ total }}</span>
    </div>
    <div
      relative flex-auto h5 font-mono flex="~"
      @dblclick="current = clicksContext.total"
    >
      <div
        v-for="i of clicksRange" :key="i"
        border="y main" of-hidden relative
        :class="[
          i === 0 ? 'rounded-l border-l' : '',
          i === total ? 'rounded-r border-r' : '',
        ]"
        :style="{ width: length > 0 ? `${1 / length * 100}%` : '100%' }"
      >
        <div absolute inset-0 :class="i <= current ? 'bg-primary op15' : ''" />
        <div
          :class="[
            +i === +current ? 'text-primary font-bold op100 border-primary' : 'op30 border-main',
            i === 0 ? 'rounded-l' : '',
            i === total ? 'rounded-r' : 'border-r-2',
          ]"
          w-full h-full text-xs flex items-center justify-center z-1
        >
          {{ i }}
        </div>
      </div>
      <input
        v-model="current"
        class="range" absolute inset-0
        type="range" :min="start" :max="total" :step="1" z-10 op0
        :style="{ '--thumb-width': `${1 / (length + 1) * 100}%` }"
        @mousedown="onMousedown"
        @focus="event => (event.currentTarget as HTMLElement)?.blur()"
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
