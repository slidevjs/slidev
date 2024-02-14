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
import IconButton from './IconButton.vue'

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
    <IconButton title="Draw with stylus" :class="{ shallow: drawingMode !== 'stylus' }" @click="setDrawingMode('stylus')">
      <carbon:pen />
    </IconButton>
    <IconButton title="Draw a line" :class="{ shallow: drawingMode !== 'line' }" @click="setDrawingMode('line')">
      <svg width="1em" height="1em" class="-mt-0.5" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
        <path d="M21.71 3.29a1 1 0 0 0-1.42 0l-18 18a1 1 0 0 0 0 1.42a1 1 0 0 0 1.42 0l18-18a1 1 0 0 0 0-1.42z" fill="currentColor" />
      </svg>
    </IconButton>
    <IconButton title="Draw an arrow" :class="{ shallow: drawingMode !== 'arrow' }" @click="setDrawingMode('arrow')">
      <carbon:arrow-up-right />
    </IconButton>
    <IconButton title="Draw an ellipse" :class="{ shallow: drawingMode !== 'ellipse' }" @click="setDrawingMode('ellipse')">
      <carbon:radio-button />
    </IconButton>
    <IconButton title="Draw a rectangle" :class="{ shallow: drawingMode !== 'rectangle' }" @click="setDrawingMode('rectangle')">
      <carbon:checkbox />
    </IconButton>
    <!-- TODO: not sure why it's not working! -->
    <!-- <IconButton title="Erase" :class="{ shallow: drawingMode != 'eraseLine' }" @click="setDrawingMode('eraseLine')">
      <carbon:erase />
    </IconButton> -->

    <VerticalDivider />

    <IconButton
      v-for="color of brushColors"
      :key="color"
      title="Set brush color"
      :class="brush.color === color ? 'active' : 'shallow'"
      @click="setBrushColor(color)"
    >
      <div
        class="w-6 h-6 transition-all transform border border-gray-400/50"
        :class="brush.color !== color ? 'rounded-1/2 scale-85' : 'rounded-md'"
        :style="drawingEnabled ? { background: color } : { borderColor: color }"
      />
    </IconButton>

    <VerticalDivider />

    <IconButton title="Undo" :class="{ disabled: !canUndo }" @click="undo()">
      <carbon:undo />
    </IconButton>
    <IconButton title="Redo" :class="{ disabled: !canRedo }" @click="redo()">
      <carbon:redo />
    </IconButton>
    <IconButton title="Delete" :class="{ disabled: !canClear }" @click="clearDrauu()">
      <carbon:delete />
    </IconButton>

    <VerticalDivider />
    <IconButton :title="drawingPinned ? 'Unpin drawing' : 'Pin drawing'" :class="{ shallow: !drawingPinned }" @click="drawingPinned = !drawingPinned">
      <carbon:pin-filled v-show="drawingPinned" class="transform -rotate-45" />
      <carbon:pin v-show="!drawingPinned" />
    </IconButton>
    <IconButton
      v-if="drawingEnabled"
      :title="drawingPinned ? 'Drawing pinned' : 'Drawing unpinned'"
      :class="{ shallow: !drawingEnabled }"
      @click="drawingEnabled = !drawingEnabled"
    >
      <carbon:error v-show="drawingPinned" />
      <carbon:close-outline v-show="!drawingPinned" />
    </IconButton>
  </Draggable>
</template>
