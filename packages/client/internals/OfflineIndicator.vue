<script setup lang="ts">
import { offlineCaching, offlineReady } from '../setup/pwa'
</script>

<template>
  <Transition name="slidev-offline-fade">
    <div
      v-if="offlineCaching || offlineReady"
      class="slidev-offline-indicator"
      :class="{ ready: offlineReady }"
    >
      <span v-if="offlineCaching">Caching for offline…</span>
      <span v-else-if="offlineReady">Ready offline</span>
    </div>
  </Transition>
</template>

<style scoped>
.slidev-offline-indicator {
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

.slidev-offline-indicator.ready {
  color: #7dce82;
}

.slidev-offline-fade-enter-active,
.slidev-offline-fade-leave-active {
  transition: opacity 0.35s ease;
}

.slidev-offline-fade-enter-from,
.slidev-offline-fade-leave-to {
  opacity: 0;
}
</style>
