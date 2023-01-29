<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { isScreenVertical, showEditor, slideScale, windowSize } from '../state'
import { isEmbedded, isPrintMode, next, prev, useSwipeControls } from '../logic/nav'
import { isDrawing } from '../logic/drawings'
import { registerShortcuts } from '../logic/shortcuts'
import { configs, themeVars } from '../env'
import Controls from './Controls.vue'
import SlideContainer from './SlideContainer.vue'
import NavControls from './NavControls.vue'
import SlidesShow from './SlidesShow.vue'
import PrintStyle from './PrintStyle.vue'

registerShortcuts()

const root = ref<HTMLDivElement>()
function onClick(e: MouseEvent) {
  if (showEditor.value)
    return

  if ((e.target as HTMLElement)?.id === 'slide-container') {
    // click right to next, left to previous
    if ((e.screenX / window.innerWidth) > 0.6)
      next()
    else
      prev()
  }
}

useSwipeControls(root)

const persistNav = computed(() => isScreenVertical.value || showEditor.value)

const Editor = shallowRef<any>()
if (__DEV__)
  import('./Editor.vue').then(v => Editor.value = v.default)

const DrawingControls = shallowRef<any>()
if (__SLIDEV_FEATURE_DRAWINGS__)
  import('./DrawingControls.vue').then(v => DrawingControls.value = v.default)
</script>

<template>
  <PrintStyle v-if="isPrintMode" />
  <div id="page-root" ref="root" class="grid grid-cols-[1fr_max-content]" :style="themeVars">
    <SlideContainer
      class="w-full h-full"
      :style="{ background: 'var(--slidev-slide-container-background, black)' }"
      :width="isPrintMode ? windowSize.width.value : undefined"
      :scale="slideScale"
      @pointerdown="onClick"
    >
      <template #default>
        <SlidesShow context="slide" />
      </template>
      <template #controls>
        <div
          class="absolute bottom-0 left-0 transition duration-300 opacity-0 hover:opacity-100"
          :class="[
            persistNav ? 'opacity-100 right-0' : 'opacity-0 p-2',
            isDrawing ? 'pointer-events-none' : '',
          ]"
        >
          <NavControls class="m-auto" :persist="persistNav" />
        </div>
        <template v-if="__SLIDEV_FEATURE_DRAWINGS__ && !configs.drawings.presenterOnly && !isEmbedded && DrawingControls">
          <DrawingControls class="ml-0" />
        </template>
      </template>
    </SlideContainer>

    <template v-if="__DEV__">
      <Editor v-if="Editor && showEditor" />
    </template>
  </div>
  <Controls />
</template>
