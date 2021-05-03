<script setup lang="ts">
import { ref } from 'vue'
import { isPrintMode, showEditor, windowSize, isScreenVertical } from '../state'
import { next, prev, currentRoute, tab, tabElements, useSwipeControls } from '../logic/nav'
import { registerShotcuts } from '../logic/shortcuts'
import Controls from './Controls.vue'
import SlideContainer from './SlideContainer.vue'
import Editor from './Editor.vue'
import NavControls from './NavControls.vue'

registerShotcuts()

const root = ref<HTMLDivElement>()
function onClick(e: MouseEvent) {
  if ((e.target as HTMLElement)?.id === 'slide-container') {
    // click right to next, left to previouse
    if ((e.screenX / window.innerWidth) > 0.6)
      next()
    else
      prev()
  }
}

useSwipeControls(root)
</script>

<template>
  <div id="page-root" ref="root" class="grid grid-cols-[1fr,max-content]">
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
        <div
          class="absolute bottom-0 left-0 transition duration-300 opacity-0 hover:opacity-100"
          :class="isScreenVertical ? 'opacity-100 right-0' : 'oapcity-0 p-2'"
        >
          <NavControls
            class="m-auto"
            :class="isScreenVertical
              ? 'text-white bg-transparent'
              : 'rounded-md bg-main shadow dark:(border border-gray-400 border-opacity-10)'"
          />
        </div>
      </template>
    </SlideContainer>

    <template v-if="__DEV__">
      <Editor v-if="showEditor" />
    </template>
  </div>
  <Controls />
</template>
