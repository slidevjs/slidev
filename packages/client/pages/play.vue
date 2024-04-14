<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { isScreenVertical, showEditor } from '../state'
import { useSwipeControls } from '../composables/useSwipeControls'
import { usePrintStyle } from '../composables/usePrintStyle'
import { registerShortcuts } from '../logic/shortcuts'
import Controls from '../internals/Controls.vue'
import SlideContainer from '../internals/SlideContainer.vue'
import NavControls from '../internals/NavControls.vue'
import SlidesShow from '../internals/SlidesShow.vue'
import { onContextMenu } from '../logic/contextMenu'
import { useNav } from '../composables/useNav'
import { useDrawings } from '../composables/useDrawings'
import PlayTemplate from '#slidev/page-templates/play'

const { next, prev } = useNav()
const { isDrawing } = useDrawings()

const root = ref<HTMLDivElement>()

useSwipeControls(root)
registerShortcuts()
usePrintStyle()

function onClick(e: MouseEvent) {
  if (showEditor.value)
    return

  if (e.button === 0 && (e.target as HTMLElement)?.id === 'slide-container') {
    // click right to next, left to previous
    if ((e.pageX / window.innerWidth) > 0.6)
      next()
    else
      prev()
  }
}

const persistNav = computed(() => isScreenVertical.value || showEditor.value)

const SideEditor = shallowRef<any>()
if (__DEV__ && __SLIDEV_FEATURE_EDITOR__)
  import('../internals/SideEditor.vue').then(v => SideEditor.value = v.default)
</script>

<template>
  <PlayTemplate id="page-root">
    <template #slides="attrs">
      <SlideContainer
        is-main
        v-bind="attrs"
        @pointerdown="onClick"
        @contextmenu="onContextMenu"
        @update:slide-element="el => (root = el)"
      >
        <template #default>
          <SlidesShow render-context="slide" />
        </template>
        <template #controls>
          <div
            class="absolute bottom-0 left-0 transition duration-300 opacity-0 hover:opacity-100"
            :class="[
              persistNav ? '!opacity-100 right-0' : 'opacity-0 p-2',
              isDrawing ? 'pointer-events-none' : '',
            ]"
          >
            <NavControls class="m-auto" :persist="persistNav" />
          </div>
        </template>
      </SlideContainer>
    </template>
    <template v-if="__DEV__ && __SLIDEV_FEATURE_EDITOR__ && SideEditor && showEditor" #editor>
      <SideEditor :resize="true" />
    </template>
    <template #floating>
      <Controls />
    </template>
  </PlayTemplate>
</template>
