<script setup lang="ts">
import { showEditor } from '../state'
import { useNavigateControls } from '../logic'
import Controls from './Controls.vue'
import SlideContainer from './SlideContainer.vue'
import Editor from './Editor.vue'
import NavControls from './NavControls.vue'

const controls = useNavigateControls()

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
      <template #controls>
        <NavControls />
      </template>
    </SlideContainer>
    <Editor v-if="showEditor" />
  </div>
  <Controls/>
</template>
