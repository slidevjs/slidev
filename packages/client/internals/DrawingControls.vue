<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Position } from '@vueuse/core'
import {
  brush, brushColors, canClear,
  canRedo, canUndo, clearDrauu,
  drauu, drauuOptions, drawingEnabled, drawingMode, drawingPinned,
} from '../logic/drawings'
import VerticalDivider from './VerticalDivider.vue'
import Draggable from './Draggable.vue'

function undo() {
  drauu.undo()
}
function redo() {
  drauu.redo()
}
function setDrawingMode(mode: typeof drawingMode.value) {
  drawingMode.value = mode
  drawingEnabled.value = true
}
function setBrushColor(color: typeof brush.color) {
  brush.color = color
  drawingEnabled.value = true
}

const brushSize = ref(drauuOptions.brush!.size)
const excludeDraggableClass = 'drawing-control-fixed'

function onStart(position: Position, event: PointerEvent) {
  const { target } = event
  if (!(target instanceof HTMLElement))
    return
  if (target.classList.contains(excludeDraggableClass))
    return false
}

watch(brushSize, () => {
  if (drauuOptions.brush?.size)
    drauuOptions.brush.size = brushSize.value
})
</script>

<template>
  <Draggable
    class="flex flex-wrap text-xl p-2 gap-1 rounded-md bg-main shadow transition-opacity duration-200"
    dark="border border-gray-400 border-opacity-10"
    :class="drawingEnabled ? '' : drawingPinned ? 'opacity-40 hover:opacity-90' : 'opacity-0 pointer-events-none'"
    storage-key="slidev-drawing-pos"
    :initial-x="10"
    :initial-y="10"
    :on-start="onStart"
  >
    <button class="icon-btn" :class="{ shallow: drawingMode !== 'stylus' }" @click="setDrawingMode('stylus')">
      <carbon:pen />
    </button>
    <button class="icon-btn" :class="{ shallow: drawingMode !== 'line' }" @click="setDrawingMode('line')">
      <svg width="1em" height="1em" class="-mt-0.5" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
        <path d="M21.71 3.29a1 1 0 0 0-1.42 0l-18 18a1 1 0 0 0 0 1.42a1 1 0 0 0 1.42 0l18-18a1 1 0 0 0 0-1.42z" fill="currentColor" />
      </svg>
    </button>
    <button class="icon-btn" :class="{ shallow: drawingMode !== 'arrow' }" @click="setDrawingMode('arrow')">
      <carbon:arrow-up-right />
    </button>
    <button class="icon-btn" :class="{ shallow: drawingMode !== 'ellipse' }" @click="setDrawingMode('ellipse')">
      <carbon:radio-button />
    </button>
    <button class="icon-btn" :class="{ shallow: drawingMode !== 'rectangle' }" @click="setDrawingMode('rectangle')">
      <carbon:checkbox />
    </button>
    <!-- TODO: not sure why it's not working! -->
    <!-- <button class="icon-btn" :class="{ shallow: drawingMode != 'eraseLine' }" @click="setDrawingMode('eraseLine')">
      <carbon:erase />
    </button> -->

    <VerticalDivider />

    <button
      v-for="color of brushColors"
      :key="color"
      class="icon-btn"
      :class="brush.color === color ? 'active' : 'shallow'"
      @click="setBrushColor(color)"
    >
      <div
        class="w-6 h-6 transition-all transform border border-gray-400/50"
        :class="brush.color !== color ? 'rounded-1/2 scale-85' : 'rounded-md'"
        :style="drawingEnabled ? { background: color } : { borderColor: color }"
      />
    </button>

    <VerticalDivider />

    <div class="flex items-center w-22">
      <input
        v-model="brushSize"
        class="drawing-control-range drawing-control-fixed"
        type="range"
        min="1"
        max="10"
        step="0.5"
      >
    </div>

    <VerticalDivider />

    <button class="icon-btn" :class="{ disabled: !canUndo }" @click="undo()">
      <carbon:undo />
    </button>
    <button class="icon-btn" :class="{ disabled: !canRedo }" @click="redo()">
      <carbon:redo />
    </button>
    <button class="icon-btn" :class="{ disabled: !canClear }" @click="clearDrauu()">
      <carbon:delete />
    </button>

    <VerticalDivider />
    <button class="icon-btn" :class="{ shallow: !drawingPinned }" @click="drawingPinned = !drawingPinned">
      <carbon:pin-filled v-show="drawingPinned" class="transform -rotate-45" />
      <carbon:pin v-show="!drawingPinned" />
    </button>
    <button
      v-if="drawingEnabled"
      class="icon-btn"
      :class="{ shallow: !drawingEnabled }"
      @click="drawingEnabled = !drawingEnabled"
    >
      <carbon:error v-show="drawingPinned" />
      <carbon:close-outline v-show="!drawingPinned" />
    </button>
  </Draggable>
</template>

<style lang="postcss" scoped>
.drawing-control-range {
  @apply w-full appearance-none;
}
.drawing-control-range:focus {
  @apply outline-0;
}

.drawing-control-range::-webkit-slider-thumb {
  @apply w-5 h-5 border-2 border-cyan-500 rounded-full cursor-pointer bg-white appearance-none;
  margin-top: -7px;
}
.drawing-control-range::-webkit-slider-runnable-track {
  @apply bg-cyan-500 w-full h-1.5 rounded-md cursor-pointer border-0;
}
.drawing-control-range:focus::-webkit-slider-runnable-track {
  @apply bg-cyan-500;
}

.drawing-control-range::-moz-range-thumb {
  @apply w-5 h-5 border-2 border-cyan-500 rounded-full cursor-pointer bg-white;
}
.drawing-control-range::-moz-range-track {
  @apply bg-cyan-500 w-full h-1.5 rounded-md cursor-pointer;
}
.drawing-control-range:focus::-moz-range-track {
  @apply bg-cyan-500;
}

.drawing-control-range::-ms-thumb {
  @apply w-5 h-5 border-2 border-cyan-500 rounded-full cursor-pointer bg-white mt-0;
}
.drawing-control-range::-ms-track {
  @apply bg-cyan-500 w-full h-1.5 rounded-md cursor-pointer bg-transparent border-transparent text-transparent;
  border-width: 20px 0;
}
.drawing-control-range::-ms-fill-lower {
  @apply rounded-md bg-cyan-500;
}
.drawing-control-range:focus::-ms-fill-lower {
  @apply bg-cyan-300;
}
.drawing-control-range::-ms-fill-upper {
  @apply bg-slate-300 rounded-md;
}
.drawing-control-range:focus::-ms-fill-upper {
  @apply bg-slate-200;
}
</style>
