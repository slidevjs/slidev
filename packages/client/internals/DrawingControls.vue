<script setup lang="ts">
import { Menu } from 'floating-vue'
import { useDrawings } from '../composables/useDrawings'
import Draggable from './Draggable.vue'
import IconButton from './IconButton.vue'
import VerticalDivider from './VerticalDivider.vue'

const {
  brush,
  canClear,
  canRedo,
  canUndo,
  clear,
  drauu,
  drawingEnabled,
  drawingMode,
  drawingPinned,
  brushColors,
} = useDrawings()

function undo() {
  drauu.undo()
}
function redo() {
  drauu.redo()
}

let lastDrawingMode: typeof drawingMode.value = 'stylus'
function setDrawingMode(mode: typeof drawingMode.value) {
  drawingMode.value = mode
  drawingEnabled.value = true
  if (mode !== 'eraseLine')
    lastDrawingMode = mode
}
function setBrushColor(color: typeof brush.color) {
  brush.color = color
  drawingEnabled.value = true
  drawingMode.value = lastDrawingMode
}
</script>

<template>
  <Draggable
    v-if="drawingEnabled || drawingPinned"
    class="flex flex-wrap text-xl p-2 gap-1 rounded-md bg-main shadow transition-opacity duration-200 z-nav  border border-main"
    :class="!drawingEnabled && drawingPinned ? 'opacity-40 hover:opacity-90' : ''"
    storage-key="slidev-drawing-pos"
    :initial-x="10"
    :initial-y="10"
  >
    <IconButton title="Draw with stylus" :class="{ shallow: drawingMode !== 'stylus' }" @click="setDrawingMode('stylus')">
      <div class="i-carbon:pen" />
    </IconButton>
    <IconButton title="Draw a line" :class="{ shallow: drawingMode !== 'line' }" @click="setDrawingMode('line')">
      <svg width="1em" height="1em" class="-mt-0.5" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
        <path d="M21.71 3.29a1 1 0 0 0-1.42 0l-18 18a1 1 0 0 0 0 1.42a1 1 0 0 0 1.42 0l18-18a1 1 0 0 0 0-1.42z" fill="currentColor" />
      </svg>
    </IconButton>
    <IconButton title="Draw an arrow" :class="{ shallow: drawingMode !== 'arrow' }" @click="setDrawingMode('arrow')">
      <div class="i-carbon:arrow-up-right" />
    </IconButton>
    <IconButton title="Draw an ellipse" :class="{ shallow: drawingMode !== 'ellipse' }" @click="setDrawingMode('ellipse')">
      <div class="i-carbon:radio-button" />
    </IconButton>
    <IconButton title="Draw a rectangle" :class="{ shallow: drawingMode !== 'rectangle' }" @click="setDrawingMode('rectangle')">
      <div class="i-carbon:checkbox" />
    </IconButton>
    <IconButton title="Erase" :class="{ shallow: drawingMode !== 'eraseLine' }" @click="setDrawingMode('eraseLine')">
      <div class="i-carbon:erase" />
    </IconButton>

    <VerticalDivider />

    <Menu>
      <IconButton title="Adjust stroke width" :class="{ shallow: drawingMode === 'eraseLine' }">
        <svg viewBox="0 0 32 32" width="1.2em" height="1.2em">
          <line x1="2" y1="15" x2="22" y2="4" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
          <line x1="2" y1="24" x2="28" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <line x1="7" y1="31" x2="29" y2="19" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
      </IconButton>
      <template #popper>
        <div class="flex bg-main p-2">
          <div class="inline-block w-7 text-center">
            {{ brush.size }}
          </div>
          <div class="pt-.5">
            <input v-model="brush.size" type="range" min="1" max="15" @change="drawingMode = lastDrawingMode">
          </div>
        </div>
      </template>
    </Menu>
    <IconButton
      v-for="color of brushColors"
      :key="color"
      title="Set brush color"
      :class="brush.color === color && drawingMode !== 'eraseLine' ? 'active' : 'shallow'"
      @click="setBrushColor(color)"
    >
      <div
        class="w-6 h-6 transition-all transform border"
        :class="brush.color !== color ? 'rounded-1/2 scale-85 border-white' : 'rounded-md border-gray-300/50'"
        :style="drawingEnabled ? { background: color } : { borderColor: color }"
      />
    </IconButton>

    <VerticalDivider />

    <IconButton title="Undo" :class="{ disabled: !canUndo }" @click="undo()">
      <div class="i-carbon:undo" />
    </IconButton>
    <IconButton title="Redo" :class="{ disabled: !canRedo }" @click="redo()">
      <div class="i-carbon:redo" />
    </IconButton>
    <IconButton title="Delete" :class="{ disabled: !canClear }" @click="clear()">
      <div class="i-carbon:trash-can" />
    </IconButton>

    <VerticalDivider />
    <IconButton :title="drawingPinned ? 'Unpin drawing' : 'Pin drawing'" :class="{ shallow: !drawingPinned }" @click="drawingPinned = !drawingPinned">
      <div v-show="drawingPinned" class="i-carbon:pin-filled transform -rotate-45" />
      <div v-show="!drawingPinned" class="i-carbon:pin" />
    </IconButton>
    <IconButton
      v-if="drawingEnabled"
      :title="drawingPinned ? 'Drawing pinned' : 'Drawing unpinned'"
      :class="{ shallow: !drawingEnabled }"
      @click="drawingEnabled = !drawingEnabled"
    >
      <div v-show="drawingPinned" class="i-carbon:error" />
      <div v-show="!drawingPinned" class="i-carbon:close-outline" />
    </IconButton>
  </Draggable>
</template>

<style>
.v-popper--theme-menu .v-popper__arrow-inner {
  --uno: border-main;
}
</style>
