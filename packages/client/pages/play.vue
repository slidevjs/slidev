<script setup lang="ts">
import { useStyleTag } from '@vueuse/core'
import { computed, ref, shallowRef } from 'vue'
import { useDrawings } from '../composables/useDrawings'
import { useNav } from '../composables/useNav'
import { useSwipeControls } from '../composables/useSwipeControls'
import { useWakeLock } from '../composables/useWakeLock'
import Controls from '../internals/Controls.vue'
import NavControls from '../internals/NavControls.vue'
import PresenterMouse from '../internals/PresenterMouse.vue'
import PrintStyle from '../internals/PrintStyle.vue'
import SlideContainer from '../internals/SlideContainer.vue'
import SlidesShow from '../internals/SlidesShow.vue'
import { onContextMenu } from '../logic/contextMenu'
import { registerShortcuts } from '../logic/shortcuts'
import { editorHeight, editorWidth, isEditorVertical, isScreenVertical, showEditor, windowSize } from '../state'

const { next, prev, isPrintMode } = useNav()
const { isDrawing } = useDrawings()

const root = ref<HTMLDivElement>()
function onClick(e: MouseEvent) {
  if (showEditor.value)
    return

  if (e.button === 0 && (e.target as HTMLElement)?.id === 'slide-container') {
    // click right to next, left to previous
    if ((e.pageX / window.innerWidth) > 0.5)
      next()
    else
      prev()
  }
}

useSwipeControls(root)
registerShortcuts()
if (__SLIDEV_FEATURE_WAKE_LOCK__)
  useWakeLock()

if (import.meta.hot) {
  useStyleTag(computed(() => showEditor.value
    ? `
    vite-error-overlay {
      --width: calc(100vw - ${isEditorVertical.value ? 0 : editorWidth.value}px);
      --height: calc(100vh - ${isEditorVertical.value ? editorHeight.value : 0}px);
      position: fixed;
      left: 0;
      top: 0;
      width: calc(var(--width) / var(--slidev-slide-scale));
      height: calc(var(--height) / var(--slidev-slide-scale));
      transform-origin: top left;
      transform: scale(var(--slidev-slide-scale));
    }`
    : '',
  ))
}

const persistNav = computed(() => isScreenVertical.value || showEditor.value)

const SideEditor = shallowRef<any>()
if (__DEV__ && __SLIDEV_FEATURE_EDITOR__)
  import('../internals/SideEditor.vue').then(v => SideEditor.value = v.default)
</script>

<template>
  <PrintStyle v-if="isPrintMode" />
  <div
    id="page-root" ref="root" class="grid"
    :class="isEditorVertical ? 'grid-rows-[1fr_max-content]' : 'grid-cols-[1fr_max-content]'"
  >
    <SlideContainer
      :style="{ background: 'var(--slidev-slide-container-background, black)' }"
      :width="isPrintMode ? windowSize.width.value : undefined"
      is-main
      @pointerdown="onClick"
      @contextmenu="onContextMenu"
    >
      <template #default>
        <SlidesShow render-context="slide" />
        <PresenterMouse />
      </template>
      <template #controls>
        <div
          v-if="!isPrintMode"
          class="absolute bottom-0 left-0 transition duration-300 opacity-0 hover:opacity-100 focus-within:opacity-100 focus-visible:opacity-100"
          :class="[
            persistNav ? '!opacity-100 right-0' : 'opacity-0 p-2',
            isDrawing ? 'pointer-events-none' : '',
          ]"
        >
          <NavControls :persist="persistNav" />
        </div>
      </template>
    </SlideContainer>
    <SideEditor v-if="SideEditor && showEditor" :resize="true" />
  </div>
  <Controls v-if="!isPrintMode" />
  <div id="twoslash-container" />
</template>
