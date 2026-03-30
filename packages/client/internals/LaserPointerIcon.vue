<script setup lang="ts">
import { showLaserPointer } from '../state'
</script>

<template>
  <div class="laser-toggle-icon" :class="{ active: showLaserPointer }">
    <div class="laser-toggle-ring" />
    <div class="laser-toggle-core" />
  </div>
</template>

<style scoped>
.laser-toggle-icon {
  position: relative;
  margin: auto;
  width: 1em;
  height: 1em;
}

.laser-toggle-ring,
.laser-toggle-core {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 9999px;
  transform: translate(-50%, -50%);
  transition: all 0.2s ease;
}

.laser-toggle-ring {
  width: 98%;
  height: 98%;
  border: 1.8px solid currentColor;
  box-shadow: 0 0 2px currentColor;
}

.active .laser-toggle-ring {
  border-color: rgb(239 68 68);
  box-shadow: 0 0 6px rgb(239 68 68 / 60%);
}

.laser-toggle-core {
  width: 42%;
  height: 42%;
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
}

.active .laser-toggle-core {
  background: rgb(239 68 68);
  box-shadow: 0 0 10px rgb(239 68 68 / 70%);
}
</style>
