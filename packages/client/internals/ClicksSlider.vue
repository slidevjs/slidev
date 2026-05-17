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
}>(), {
  active: true,
})

const emit = defineEmits<{
  (type: 'activate'): void
  (type: 'reset'): void
}>()

const total = computed(() => props.clicksContext.total)
const start = computed(() => clamp(0, props.clicksContext.clicksStart, total.value))
const dragStart = computed(() => props.resettable ? -1 : start.value)
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

function syncCurrentFromPointer(event: PointerEvent) {
  if (props.readonly || !(event.buttons & 1) || !sliderEl.value)
    return
  const rect = sliderEl.value.getBoundingClientRect()
  const ratio = clamp(0, (event.clientX - rect.left) / Math.max(1, rect.width), 1)
  const next = Math.round(dragStart.value + ratio * (total.value - dragStart.value))
  current.value = clamp(dragStart.value, next, total.value)
}

function syncCurrentFromVisibleBlock(event: PointerEvent) {
  if (props.readonly || !sliderEl.value)
    return
  const rect = sliderEl.value.getBoundingClientRect()
  const ratio = clamp(0, (event.clientX - rect.left) / Math.max(1, rect.width), 0.999999)
  current.value = clamp(start.value, start.value + Math.floor(ratio * length.value), total.value)
}

function onPointerDown(event: PointerEvent) {
  if (props.readonly)
    return
  event.preventDefault()
  sliderEl.value?.setPointerCapture(event.pointerId)
  syncCurrentFromVisibleBlock(event)
}
</script>

<template>
  <div
    class="flex gap-1 items-center select-none"
    :title="`Clicks in this slide: ${length}`"
    :class="length && props.clicksContext.isMounted ? '' : 'op50'"
  >
    <div
      class="flex items-center font-mono"
      :class="compact ? 'gap-1 min-w-0 mr0' : 'gap-0.2 min-w-16 mr1'"
    >
      <div class="i-carbon:cursor-1 text-sm op50" />
      <template v-if="current >= 0 && current !== CLICKS_MAX && active">
        <div v-if="!compact" flex-auto />
        <span>
          <span text-primary>{{ current }}</span>
          <span op25 :class="compact ? '' : 'text-sm'">/</span>
          <span op50 :class="compact ? '' : 'text-sm'">{{ total }}</span>
        </span>
      </template>
      <div
        v-else
        op50
        :class="compact ? '' : 'flex-auto pl1'"
      >
        <span>{{ total }}</span>
        <span v-if="compact" invisible>/{{ total }}</span>
      </div>
    </div>
    <div
      ref="sliderEl"
      relative flex-auto h5 font-mono flex="~"
      :class="isReset ? 'op80' : ''"
      @pointerdown.capture="onPointerDown"
      @pointermove="syncCurrentFromPointer"
    >
      <div
        v-for="i of clicksRange" :key="i"
        border="y main" of-hidden relative
        :class="[
          i === 0 ? 'rounded-l border-l' : '',
          i === total ? 'border-r' : '',
          i === total && +i !== +current ? 'rounded-r' : '',
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
            i === 0 ? 'rounded-l' : '',
            i === total && +i !== +current ? 'rounded-r' : '',
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
