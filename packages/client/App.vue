<script setup lang="ts">
import { provide } from 'vue'
import { useNavigateControls } from './logic'
import { injectClickDisabled } from './modules/directives'
import Controls from './internals/Controls.vue'
import setupHead from './setup/head'
import SlideContainer from './internals/SlideContainer.vue'

setupHead()

const controls = useNavigateControls()

const query = new URLSearchParams(location.search)
if (query.has('print'))
  provide(injectClickDisabled, true)

function onClick(e: MouseEvent) {
  if ((e.target as HTMLElement)?.id === 'slide-container') {
    // click right to next, left to previouse
    if ((e.screenX / window.innerWidth) > 0.6)
      controls.next()
    else
      controls.prev()
  }
}
</script>

<template>
  <div id="page-root">
    <SlideContainer class="w-full h-full bg-black" @click="onClick">
      <RouterView :class="controls.currentRoute.value?.meta?.class || ''" />
    </SlideContainer>
    <Controls v-if="!query.has('print')" />
  </div>
</template>
