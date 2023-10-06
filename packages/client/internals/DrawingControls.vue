<script setup lang="ts">
import {
  brush,
  brushColors,
  canClear,
  canRedo,
  canUndo,
  clearDrauu,
  drauu,
  drawingEnabled,
  drawingMode,
  drawingPinned,
} from '../logic/drawings'
import VerticalDivider from './VerticalDivider.vue'
import Draggable from './Draggable.vue'
import HiddenText from './HiddenText.vue'

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
</script>

<template>
  <Draggable
    class="flex flex-wrap text-xl p-2 gap-1 rounded-md bg-main shadow transition-opacity duration-200"
    dark="border border-gray-400 border-opacity-10"
    :class="drawingEnabled ? '' : drawingPinned ? 'opacity-40 hover:opacity-90' : 'opacity-0 pointer-events-none'"
    storage-key="slidev-drawing-pos"
    :initial-x="10"
    :initial-y="10"
  >
    <button class="slidev-icon-btn" :class="{ shallow: drawingMode !== 'stylus' }" @click="setDrawingMode('stylus')">
      <HiddenText text="Draw with stylus" />
      <carbon:pen />
    </button>
    <button class="slidev-icon-btn" :class="{ shallow: drawingMode !== 'line' }" @click="setDrawingMode('line')">
      <HiddenText text="Draw a line" />
      <svg width="1em" height="1em" class="-mt-0.5" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
        <path d="M21.71 3.29a1 1 0 0 0-1.42 0l-18 18a1 1 0 0 0 0 1.42a1 1 0 0 0 1.42 0l18-18a1 1 0 0 0 0-1.42z" fill="currentColor" />
      </svg>
    </button>
    <button class="slidev-icon-btn" :class="{ shallow: drawingMode !== 'arrow' }" @click="setDrawingMode('arrow')">
      <HiddenText text="Draw an arrow" />
      <carbon:arrow-up-right />
    </button>
    <button class="slidev-icon-btn" :class="{ shallow: drawingMode !== 'ellipse' }" @click="setDrawingMode('ellipse')">
      <HiddenText text="Draw an ellipse" />
      <carbon:radio-button />
    </button>
    <button class="slidev-icon-btn" :class="{ shallow: drawingMode !== 'rectangle' }" @click="setDrawingMode('rectangle')">
      <HiddenText text="Draw a rectangle" />
      <carbon:checkbox />
    </button>
    <!-- TODO: not sure why it's not working! -->
    <!-- <button class="slidev-icon-btn" :class="{ shallow: drawingMode != 'eraseLine' }" @click="setDrawingMode('eraseLine')">
      <HiddenText text="Erase" />
      <carbon:erase />
    </button> -->

    <VerticalDivider />

    <button
      v-for="color of brushColors"
      :key="color"
      class="slidev-icon-btn"
      :class="brush.color === color ? 'active' : 'shallow'"
      @click="setBrushColor(color)"
    >
      <HiddenText text="Set brush color" />
      <div
        class="w-6 h-6 transition-all transform border border-gray-400/50"
        :class="brush.color !== color ? 'rounded-1/2 scale-85' : 'rounded-md'"
        :style="drawingEnabled ? { background: color } : { borderColor: color }"
      />
    </button>

    <VerticalDivider />

    <button class="slidev-icon-btn" :class="{ disabled: !canUndo }" @click="undo()">
      <HiddenText text="Undo" />
      <carbon:undo />
    </button>
    <button class="slidev-icon-btn" :class="{ disabled: !canRedo }" @click="redo()">
      <HiddenText text="Redo" />
      <carbon:redo />
    </button>
    <button class="slidev-icon-btn" :class="{ disabled: !canClear }" @click="clearDrauu()">
      <HiddenText text="Delete" />
      <carbon:delete />
    </button>

    <VerticalDivider />
    <button class="slidev-icon-btn" :class="{ shallow: !drawingPinned }" @click="drawingPinned = !drawingPinned">
      <HiddenText :text="drawingPinned ? 'Unpin drawing' : 'Pin drawing'" />
      <carbon:pin-filled v-show="drawingPinned" class="transform -rotate-45" />
      <carbon:pin v-show="!drawingPinned" />
    </button>
    <button
      v-if="drawingEnabled"
      class="slidev-icon-btn"
      :class="{ shallow: !drawingEnabled }"
      @click="drawingEnabled = !drawingEnabled"
    >
      <HiddenText :text="drawingPinned ? 'Drawing pinned' : 'Drawing unpinned'" />
      <carbon:error v-show="drawingPinned" />
      <carbon:close-outline v-show="!drawingPinned" />
    </button>
  </Draggable>
</template>
