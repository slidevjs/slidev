<script setup lang="ts">
import { provide } from 'vue'
import { showEditor } from './state'
import { useNavigateControls } from './logic'
import { injectClickDisabled } from './modules/directives'
import Controls from './internals/Controls.vue'
import setupHead from './setup/head'
import SlideContainer from './internals/SlideContainer.vue'
import Editor from './internals/Editor.vue'
import NavControls from './internals/NavControls.vue'

setupHead()

const controls = useNavigateControls()

const query = new URLSearchParams(location.search)
const isPrint = query.has('print')
if (isPrint)
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
  <div id="page-root" class="grid grid-cols-[1fr,max-content]">
    <SlideContainer class="w-full h-full bg-black" @click="onClick">
      <RouterView :class="controls.currentRoute.value?.meta?.class || ''" />
      <template #controls v-if="!isPrint">
        <NavControls />
      </template>
    </SlideContainer>
    <Editor v-if="showEditor && !isPrint" />
  </div>
  <Controls v-if="!isPrint" />
</template>
