<script setup lang="ts">
import { computed } from 'vue'
import { isPrintMode, showEditor, windowSize } from '../state'
import { useNavigateControls } from '../logic'
import Controls from './Controls.vue'
import SlideContainer from './SlideContainer.vue'
import Editor from './Editor.vue'
import NavControls from './NavControls.vue'

const { next, prev, currentRoute, tab, tabElements } = useNavigateControls()

function onClick(e: MouseEvent) {
  if ((e.target as HTMLElement)?.id === 'slide-container') {
    // click right to next, left to previouse
    if ((e.screenX / window.innerWidth) > 0.6)
      next()
    else
      prev()
  }
}

const component = computed(() => currentRoute.value?.component)
</script>

<template>
  <div id="page-root" class="grid grid-cols-[1fr,max-content]">
    <SlideContainer
      class="w-full h-full bg-black"
      :width="isPrintMode ? windowSize.width.value : undefined"
      @click="onClick"
    >
      <component
        :is="component"
        v-model:tab="tab"
        v-model:tabElements="tabElements"
        :tabDisabled="false"
        :class="currentRoute?.meta?.class || ''"
      />
      <template #controls>
        <NavControls />
      </template>
    </SlideContainer>
    <Editor v-if="showEditor" />
  </div>
  <Controls />
</template>
