<script setup lang="ts">
import { isPrintMode, showEditor, windowSize } from '../state'
import { next, prev, currentRoute, tab, tabElements } from '../logic/nav'
import Controls from './Controls.vue'
import SlideContainer from './SlideContainer.vue'
import Editor from './Editor.vue'
import NavControls from './NavControls.vue'

function onClick(e: MouseEvent) {
  if ((e.target as HTMLElement)?.id === 'slide-container') {
    // click right to next, left to previouse
    if ((e.screenX / window.innerWidth) > 0.6)
      next()
    else
      prev()
  }
}
</script>

<template>
  <div id="page-root" class="grid grid-cols-[1fr,max-content]">
    <SlideContainer
      v-model:tab="tab"
      v-model:tab-elements="tabElements"
      class="w-full h-full bg-black"
      :width="isPrintMode ? windowSize.width.value : undefined"
      :route="currentRoute"
      :tab-disabled="false"
      @click="onClick"
    >
      <template #controls>
        <NavControls />
      </template>
    </SlideContainer>
    <Editor v-if="showEditor" />
  </div>
  <Controls />
</template>
