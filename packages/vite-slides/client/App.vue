<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { computed, provide } from 'vue'
import { useNavigateControls } from './logic'
import { scale, targetHeight, targetWidth } from './logic/scale'
import { injectClickDisabled } from './modules/directives'

useHead({
  title: 'Vite Slides',
  meta: [],
})

const controls = useNavigateControls()
const style = computed(() => ({
  height: `${targetHeight}px`,
  width: `${targetWidth}px`,
  transform: `translate(-50%, -50%) scale(${scale.value})`,
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
  <div>
    <div class="page-root" @click="onClick">
      <div class="slide-container" :style="style">
        <RouterView :class="controls.current.value?.meta?.class || ''" />
      </div>
    </div>
    <SlideControls v-if="!query.has('print')" />
  </div>
</template>

<style lang="postcss">
.page-root {
  @apply w-screen h-screen relative overflow-hidden bg-black select-none;
}

.slide-container {
  @apply relative overflow-hidden m-auto bg-main fixed left-1/2 top-1/2;
}
</style>
