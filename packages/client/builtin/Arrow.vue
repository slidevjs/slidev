<!--

Simple Arrow

<arrow x1="10" y1="20" x2="100" y2="200" color="green" width="3" />

<arrow v-bind="{ x1:10, y1:10, x2:200, y2:200 }"/>

-->

<script setup lang="ts">
import { makeId } from '../logic/utils'

defineProps<{
  x1: number | string
  y1: number | string
  x2: number | string
  y2: number | string
  width?: number | string
  color?: string
}>()

const id = makeId()
</script>

<template>
  <svg
    class="absolute left-0 top-0 pointer-events-none"
    :width="Math.max(+x1, +x2) + 50"
    :height="Math.max(+y1, +y2) + 50"
  >
    <defs>
      <marker
        :id="id"
        markerUnits="strokeWidth"
        :markerWidth="10"
        :markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" :fill="color || 'currentColor'" />
      </marker>
    </defs>
    <line
      :x1="+x1"
      :y1="+y1"
      :x2="+x2"
      :y2="+y2"
      :stroke="color || 'currentColor'"
      :stroke-width="width || 2"
      :marker-end="`url(#${id})`"
    />
  </svg>
</template>
