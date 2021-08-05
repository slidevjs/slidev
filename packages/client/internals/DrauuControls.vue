<script setup lang="ts">
import { drauuMode, drauu, drauuBrush, brushColors, drauuEnabled, canUndo, canRedo } from '../logic/drauu'
import VerticalDivider from './VerticalDivider.vue'

function clear() {
  if (confirm('Clear the drawing?'))
    drauu.clear()
}

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
        :class="drauuBrush.color === color ? 'active' : 'shallow'"
        @click="drauuBrush.color = color"
      >
        <div
          class="w-5 h-5 transition-all border border-gray-400/50"
          :class="drauuBrush.color !== color ? 'rounded-full' : 'rounded'"
          :style="{ background: color }"
        />
      </button>

      <VerticalDivider />

      <button class="icon-btn" :class="{ shallow: drauuMode != 'draw' }" @click="drauuMode = 'draw'">
        <carbon:draw />
      </button>
      <button class="icon-btn" :class="{ shallow: drauuMode != 'line' }" @click="drauuMode = 'line'">
        <carbon:scalpel />
      </button>
      <button class="icon-btn" :class="{ shallow: drauuMode != 'ellipse' }" @click="drauuMode = 'ellipse'">
        <carbon:radio-button />
      </button>
      <button class="icon-btn" :class="{ shallow: drauuMode != 'rectangle' }" @click="drauuMode = 'rectangle'">
        <carbon:checkbox />
      </button>

      <VerticalDivider />

      <button class="icon-btn" @click="clear()">
        <carbon:clean />
      </button>
      <button class="icon-btn" :class="{ disabled: !canUndo }" @click="undo()">
        <carbon:undo />
      </button>
      <button class="icon-btn" :class="{ disabled: !canRedo }" @click="redo()">
        <carbon:redo />
      </button>

      <template v-if="drauuEnabled">
        <VerticalDivider />
        <button class="icon-btn" @click="drauuEnabled = false">
          <carbon:close />
        </button>
      </template>
    </div>
  </div>
</template>
