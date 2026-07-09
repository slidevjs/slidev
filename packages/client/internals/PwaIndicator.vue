<script setup lang="ts">
import { pwaCaching, pwaReady } from '../setup/pwa'
</script>

<template>
  <Transition name="slidev-pwa-fade">
    <div
      v-if="pwaCaching || pwaReady"
      class="slidev-pwa-indicator"
      :class="{ ready: pwaReady }"
    >
      <span v-if="pwaCaching">Caching for offline…</span>
      <span v-else-if="pwaReady">Ready offline</span>
    </div>
  </Transition>
</template>

<style scoped>
.slidev-pwa-indicator {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 9999;
  padding: 0.4em 0.75em;
  border-radius: 0.4em;
  font-size: 0.75rem;
  font-family: sans-serif;
  line-height: 1.4;
  background: rgba(0, 0, 0, 0.72);
  color: #ccc;
  pointer-events: none;
  user-select: none;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.slidev-pwa-indicator.ready {
  color: #7dce82;
}

.slidev-pwa-fade-enter-active,
.slidev-pwa-fade-leave-active {
  transition: opacity 0.35s ease;
}

.slidev-pwa-fade-enter-from,
.slidev-pwa-fade-leave-to {
  opacity: 0;
}
</style>
