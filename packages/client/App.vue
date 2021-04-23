<script setup lang="ts">
import { computed, provide } from 'vue'
import { useNavigateControls } from './logic'
import { scale, targetHeight, targetWidth, offsetRight } from './logic/scale'
import { injectClickDisabled } from './modules/directives'
import Controls from './internals/Controls.vue'
import setupHead from './setup/head'

setupHead()

const controls = useNavigateControls()
const style = computed(() => ({
  height: `${targetHeight}px`,
  width: `${targetWidth}px`,
  transform: `translate(-50%, -50%) translateX(${-offsetRight.value / 2}px) scale(${scale.value})`,
}))

const query = new URLSearchParams(location.search)
if (query.has('print'))
  provide(injectClickDisabled, true)

function onClick(e: MouseEvent) {
  const classList = (e.target as HTMLElement)?.classList
  if (classList?.contains('page-root'))
    controls.next()
}
</script>

<template>
  <div class="page-root">
    <div
      class="slide-root"
      @click="onClick"
    >
      <div id="slide-container" class="slide-container" :style="style">
        <RouterView :class="controls.currentRoute.value?.meta?.class || ''" />
      </div>
    </div>
    <Controls v-if="!query.has('print')" />
  </div>
</template>

<style lang="postcss">
.slide-root {
  @apply w-full h-full relative overflow-hidden bg-black select-none;
}

.slide-container {
  @apply relative overflow-hidden m-auto bg-main fixed left-1/2 top-1/2;
}
</style>
