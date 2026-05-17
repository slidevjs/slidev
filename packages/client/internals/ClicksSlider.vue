<script setup lang="ts">
import type { ClicksContext } from '@slidev/types'
import { clamp, range } from '@antfu/utils'
import { computed, ref } from 'vue'
import { CLICKS_MAX } from '../constants'

const props = withDefaults(defineProps<{
  clicksContext: ClicksContext
  readonly?: boolean
  active?: boolean
  resettable?: boolean
  compact?: boolean
  attached?: boolean
}>(), {
  active: true,
})

const emit = defineEmits<{
  (type: 'activate'): void
  (type: 'reset'): void
}>()

const total = computed(() => props.clicksContext.total)
const start = computed(() => clamp(0, props.clicksContext.clicksStart, total.value))
const length = computed(() => total.value - start.value + 1)
const current = computed({
  get() {
    if (props.resettable && !props.active)
      return -1
    return props.clicksContext.current > total.value ? -1 : props.clicksContext.current
  },
  set(value: number) {
    if (props.resettable && value < 0) {
      emit('reset')
      // eslint-disable-next-line vue/no-mutating-props
      props.clicksContext.current = CLICKS_MAX
      return
    }
    emit('activate')
    // eslint-disable-next-line vue/no-mutating-props
    props.clicksContext.current = value
  },
})

const isReset = computed(() => props.resettable && current.value < 0)
const clicksRange = computed(() => range(start.value, total.value + 1))
const sliderEl = ref<HTMLElement>()
let pointerDown: { id: number, x: number, y: number } | undefined

function getPointerRatio(event: PointerEvent) {
  const rect = sliderEl.value!.getBoundingClientRect()
  return (event.clientX - rect.left) / Math.max(1, rect.width)
}

// Presses snap to a cell; drags switch only after crossing half a cell.
function setCurrentFromPointer(event: PointerEvent, snap: boolean) {
  if (props.readonly || !sliderEl.value || (!snap && !(event.buttons & 1)))
    return
  const ratio = getPointerRatio(event)
  // In resettable mode, dragging left of the rail restores the inactive state.
  if (props.resettable && ratio < 0) {
    current.value = -1
    return
  }
  // Keep press-at-right-edge inside the last cell.
  const position = clamp(0, ratio, snap ? 0.999999 : 1) * length.value
  const currentOffset = clamp(0, current.value - start.value, length.value - 1)
  let next = snap ? start.value + Math.floor(position) : current.value
  if (!snap && position >= currentOffset + 1.5)
    next = start.value + Math.floor(position - 0.5)
  else if (!snap && position < currentOffset - 0.5)
    next = start.value + Math.ceil(position - 0.5)
  current.value = clamp(start.value, next, total.value)
}

function onPointerDown(event: PointerEvent) {
  if (props.readonly)
    return
  sliderEl.value?.setPointerCapture(event.pointerId)
  pointerDown = { id: event.pointerId, x: event.clientX, y: event.clientY }
  setCurrentFromPointer(event, true)
}

function onPointerMove(event: PointerEvent) {
  if (pointerDown?.id === event.pointerId) {
    // Treat tiny movement after pointerdown as part of the click.
    if (Math.abs(event.clientX - pointerDown.x) <= 3 && Math.abs(event.clientY - pointerDown.y) <= 3)
      return
    pointerDown = undefined
  }
  setCurrentFromPointer(event, false)
}
</script>

<template>
  <div
    class="flex gap-1 select-none"
    :title="`Clicks in this slide: ${length}`"
    :class="[attached ? 'items-end' : 'items-center', length && props.clicksContext.isMounted ? '' : 'op50']"
  >
    <div
      class="flex items-center font-mono"
      :class="[compact ? 'gap-1 min-w-0 mr0' : 'gap-0.2 min-w-16 mr1', attached ? 'h-[22px]' : '']"
    >
      <div class="i-carbon:cursor-1 text-sm op50" :class="compact ? 'ml-1' : ''" />
      <template v-if="current >= 0 && current !== CLICKS_MAX && active">
        <div v-if="!compact" flex-auto />
        <span>
          <span text-primary>{{ current }}</span>
          <span op25 text-sm>/</span>
          <span op50 text-sm>{{ total }}</span>
        </span>
      </template>
      <div
        v-else
        op50
        :class="compact ? '' : 'flex-auto pl1'"
      >
        <span
          :class="compact ? 'inline-block text-center' : ''"
          :style="compact ? { width: `${String(total).length * 2 + 1}ch`, marginLeft: '-0.25ch' } : undefined"
        >{{ total }}</span>
      </div>
    </div>
    <div
      ref="sliderEl"
      relative flex-auto font-mono flex="~"
      touch-none
      :class="[attached ? 'h-[22px]' : 'h5', isReset ? 'op80' : '']"
      @pointerdown.capture="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="pointerDown = undefined"
      @pointercancel="pointerDown = undefined"
    >
      <div
        v-for="i of clicksRange" :key="i"
        border="y main" of-hidden relative
        :class="[
          i === 0 ? 'border-l' : '',
          i === 0 ? attached ? 'rounded-tl' : 'rounded-l' : '',
          i === total ? 'border-r' : '',
          i === total && +i !== +current ? attached ? 'rounded-tr' : 'rounded-r' : '',
          attached ? 'border-b-0' : '',
        ]"
        :style="{ width: length > 0 ? `${1 / length * 100}%` : '100%' }"
      >
        <div
          absolute inset-0
          :class="(i <= current && active) ? 'bg-primary op15' : ''"
        />
        <div
          v-if="+i === +current && active"
          absolute inset-y-0 right-0 w-0.5 bg-primary z-1
        />
        <div
          :class="[
            (+i === +current && active) ? 'text-primary font-bold op100' : 'op30',
            i !== total ? 'border-r-2 border-main' : '',
          ]"
          w-full h-full text-xs flex items-center justify-center z-1
        >
          {{ i }}
        </div>
      </div>
    </div>
  </div>
</template>
