<script setup lang="ts">
import type { ClicksContext } from '@slidev/types'
import { clamp, range } from '@antfu/utils'
import { computed } from 'vue'
import { CLICKS_MAX } from '../constants'

const props = withDefaults(defineProps<{
  clicksContext: ClicksContext
  readonly?: boolean
  active?: boolean
}>(), {
  active: true,
})

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
  if (props.readonly)
    return
  if (current.value < 0 || current.value > total.value)
    current.value = 0
}
</script>

<template>
  <div
    class="flex gap-1 items-center select-none"
    :title="`Clicks in this slide: ${length}`"
    :class="length && props.clicksContext.isMounted ? '' : 'op50'"
  >
    <div class="flex gap-0.2 items-center min-w-16 font-mono mr1">
      <div class="i-carbon:cursor-1 text-sm op50" />
      <template v-if="current >= 0 && current !== CLICKS_MAX && active">
        <div flex-auto />
        <span text-primary>{{ current }}</span>
        <span op25 text-sm>/</span>
        <span op50 text-sm>{{ total }}</span>
      </template>
      <div
        v-else
        op50 flex-auto pl1
      >
        {{ total }}
      </div>
    </div>
    <div
      relative flex-auto h5 font-mono flex="~"
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
        <div
          absolute inset-0
          :class="(i <= current && active) ? 'bg-primary op15' : ''"
        />
        <div
          :class="[
            (+i === +current && active) ? 'text-primary font-bold op100 border-primary' : 'op30 border-main',
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
        class="range"
        type="range" :min="start" :max="total" :step="1"
        absolute inset-0 z-label op0
        :class="readonly ? 'pointer-events-none' : ''"
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
