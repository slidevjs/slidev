<script setup lang="ts">
import { drauuMode, drauu, drauuBrush, brushColors, drauuEnabled, canUndo, canRedo, canClear, clearDrauu } from '../logic/drauu'
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
        :class="drauuBrush.color === color ? 'active' : 'shallow'"
        @click="drauuBrush.color = color"
      >
        <div
          class="w-6 h-6 transition-all transform border border-gray-400/50"
          :class="drauuBrush.color !== color ? 'rounded-1/2 scale-85' : 'rounded'"
          :style="{ background: color }"
        />
      </button>

      <VerticalDivider />

      <button class="icon-btn" :class="{ shallow: drauuMode != 'draw' }" @click="drauuMode = 'draw'">
        <carbon:draw />
      </button>
      <button class="icon-btn" :class="{ shallow: drauuMode != 'line' }" @click="drauuMode = 'line'">
        <uil:line-alt />
      </button>
      <button class="icon-btn" :class="{ shallow: drauuMode != 'arrow' }" @click="drauuMode = 'arrow'">
        <carbon:arrow-up-right />
      </button>
      <button class="icon-btn" :class="{ shallow: drauuMode != 'ellipse' }" @click="drauuMode = 'ellipse'">
        <carbon:radio-button />
      </button>
      <button class="icon-btn" :class="{ shallow: drauuMode != 'rectangle' }" @click="drauuMode = 'rectangle'">
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

      <template v-if="drauuEnabled">
        <VerticalDivider />
        <button class="icon-btn" @click="drauuEnabled = false">
          <carbon:close />
        </button>
      </template>
    </div>
  </div>
</template>
