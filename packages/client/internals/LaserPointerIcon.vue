<script setup lang="ts">
import { showLaserPointer } from '../state'
</script>

<template>
  <div class="laser-toggle-icon">
    <div class="laser-toggle-ring" :class="{ active: showLaserPointer }" />
    <div class="laser-toggle-core" :class="{ active: showLaserPointer }" />
  </div>
</template>

<style scoped>
.laser-toggle-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.15em;
  height: 1.15em;
  min-width: 1.15em;
  min-height: 1.15em;
  aspect-ratio: 1;
  line-height: 1;
  flex: none;
  box-sizing: border-box;
}

.laser-toggle-ring,
.laser-toggle-core {
  position: absolute;
  left: 50%;
  top: 50%;
  box-sizing: border-box;
  border-radius: 9999px;
  transform: translate(-50%, -50%);
  transition: all 0.2s ease;
}

.laser-toggle-ring {
  width: 100%;
  height: 100%;
  border: 2px solid currentColor;
}

.laser-toggle-ring.active {
  border-color: rgb(239 68 68);
  box-shadow: 0 0 6px rgb(239 68 68 / 45%);
  opacity: 1;
}

.laser-toggle-core {
  width: 48%;
  height: 48%;
  background: currentColor;
}

.laser-toggle-core.active {
  background: rgb(239 68 68);
  box-shadow: 0 0 10px rgb(239 68 68 / 70%);
  opacity: 1;
}
</style>
