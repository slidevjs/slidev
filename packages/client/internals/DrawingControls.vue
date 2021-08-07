<script setup lang="ts">
import { drawingMode, drauu, brush, brushColors, drawingEnabled, canUndo, canRedo, canClear, clearDrauu } from '../logic/drawings'
import VerticalDivider from './VerticalDivider.vue'

function undo() {
  drauu.undo()
}
function redo() {
  drauu.redo()
}
</script>

<template>
  <div class="m-auto rounded-md bg-main shadow dark:(border border-gray-400 border-opacity-10)">
    <div class="flex text-xl p-2 gap-1">
      <button
        v-for="color of brushColors"
        :key="color"
        class="icon-btn"
        :class="brush.color === color ? 'active' : 'shallow'"
        @click="brush.color = color"
      >
        <div
          class="w-6 h-6 transition-all transform border border-gray-400/50"
          :class="brush.color !== color ? 'rounded-1/2 scale-85' : 'rounded'"
          :style="{ background: color }"
        />
      </button>

      <VerticalDivider />

      <button class="icon-btn" :class="{ shallow: drawingMode != 'stylus' }" @click="drawingMode = 'stylus'">
        <carbon:draw />
      </button>
      <button class="icon-btn" :class="{ shallow: drawingMode != 'line' }" @click="drawingMode = 'line'">
        <uil:line-alt />
      </button>
      <button class="icon-btn" :class="{ shallow: drawingMode != 'arrow' }" @click="drawingMode = 'arrow'">
        <carbon:arrow-up-right />
      </button>
      <button class="icon-btn" :class="{ shallow: drawingMode != 'ellipse' }" @click="drawingMode = 'ellipse'">
        <carbon:radio-button />
      </button>
      <button class="icon-btn" :class="{ shallow: drawingMode != 'rectangle' }" @click="drawingMode = 'rectangle'">
        <carbon:checkbox />
      </button>

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

      <template v-if="drawingEnabled">
        <VerticalDivider />
        <button class="icon-btn" @click="drawingEnabled = false">
          <carbon:close />
        </button>
      </template>
    </div>
  </div>
</template>
