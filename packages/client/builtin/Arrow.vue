<!--

Simple Arrow

<arrow x1="10" y1="20" x2="100" y2="200" color="green" width="3" />

<arrow v-bind="{ x1:10, y1:10, x2:200, y2:200 }"/>

-->

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { ref } from 'vue'
import { makeId } from '../logic/utils'

defineProps<{
  x1: number | string
  y1: number | string
  x2: number | string
  y2: number | string
  width?: number | string
  color?: string
  twoWay?: boolean
}>()

const emit = defineEmits(['dblclick', 'clickOutside'])

const id = makeId()

const markerAttrs = {
  markerUnits: 'strokeWidth',
  markerHeight: 7,
  refY: 3.5,
  orient: 'auto',
}

const clickArea = ref<HTMLElement>()
onClickOutside(clickArea, () => emit('clickOutside'))
</script>

<template>
  <svg
    class="absolute left-0 top-0"
    :width="Math.max(+x1, +x2) + 50"
    :height="Math.max(+y1, +y2) + 50"
  >
    <defs>
      <marker :id="id" markerWidth="10" refX="9" v-bind="markerAttrs">
        <polygon points="0 0, 10 3.5, 0 7" :fill="color || 'currentColor'" @dblclick="emit('dblclick')" />
      </marker>
      <marker v-if="twoWay" :id="`${id}-rev`" markerWidth="20" refX="11" v-bind="markerAttrs">
        <polygon points="20 0, 10 3.5, 20 7" :fill="color || 'currentColor'" @dblclick="emit('dblclick')" />
      </marker>
    </defs>
    <line
      :x1 :y1 :x2 :y2
      :stroke="color || 'currentColor'"
      :stroke-width="width || 2"
      :marker-end="`url(#${id})`"
      :marker-start="twoWay ? `url(#${id}-rev)` : 'none'"
      @dblclick="emit('dblclick')"
    />
    <line
      ref="clickArea"
      :x1 :y1 :x2 :y2
      stroke="transparent"
      stroke-linecap="round"
      :stroke-width="20"
      @dblclick="emit('dblclick')"
    />
  </svg>
</template>
