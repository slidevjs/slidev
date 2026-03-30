<script setup lang="ts">
import { computed, onMounted, watchEffect } from 'vue'
import { useMousePosInSlide } from '../composables/useMousePosInSlide'
import { useNav } from '../composables/useNav'
import { showLaserPointer } from '../state'
import { sharedState } from '../state/shared'

const selfMouse = useMousePosInSlide()
const { isPresenter } = useNav()

const laserPointer = computed(() => {
  if (showLaserPointer.value) {
    return selfMouse.value
  }
  if (!isPresenter.value && sharedState.cursor?.style === 'laser') {
    return sharedState.cursor
  }
  return null
})

onMounted(() => {
  watchEffect(() => {
    document.body.classList.toggle('slidev-self-laser-active', showLaserPointer.value && !!laserPointer.value)
  })
})
</script>

<template>
  <div
    v-if="laserPointer"
    class="absolute top-0 left-0 right-0 bottom-0 pointer-events-none text-xl"
  >
    <div
      class="laser-pointer"
      :style="{
        left: `${laserPointer.x}%`,
        top: `${laserPointer.y}%`,
      }"
    />
  </div>
</template>

<style scoped>
.laser-pointer {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle at center,
    rgba(255, 80, 80, 1) 0%,
    rgba(255, 0, 0, 0.95) 55%,
    rgba(255, 0, 0, 0.1) 100%
  );
  box-shadow:
    0 0 10px rgba(255, 0, 0, 0.9),
    0 0 22px rgba(255, 0, 0, 0.55);
}
</style>

<style>
.slidev-self-laser-active .slidev-slide-container {
  cursor: none;
}
</style>
