<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { ref, computed } from 'vue'
import { total, currentPage, currentRoute, nextRoute, tab, tabElements, useSwipeControls } from '../logic/nav'
import { showOverview } from '../state'
import { configs } from '../env'
import { registerShotcuts } from '../logic/shortcuts'
import SlideContainer from './SlideContainer.vue'
import NavControls from './NavControls.vue'
import SlidesOverview from './SlidesOverview.vue'
import NoteEditor from './NoteEditor.vue'

registerShotcuts()

useHead({
  title: configs.title ? `Presenter - ${configs.title} - Slidev` : 'Presenter - Slidev',
})

const main = ref<HTMLDivElement>()
const nextTabElements = ref([])
const nextSlide = computed(() => {
  if (tab.value < tabElements.value.length) {
    return {
      route: currentRoute.value,
      tab: tab.value + 1,
    }
  }
  else {
    return {
      route: nextRoute.value,
      tab: 0,
    }
  }
})

useSwipeControls(main)
</script>

<template>
  <div class="bg-main h-full">
    <div class="grid-container">
      <div class="grid-section top flex">
        <img src="../assets/logo-title-horizontal.png" class="h-14 ml-2 py-2 my-auto" />
        <div class="flex-auto" />
        <div class="px-4 my-auto">
          {{ currentPage + 1 }} / {{ total }}
        </div>
      </div>
      <div ref="main" class="grid-section main flex flex-col p-4">
        <SlideContainer
          key="main"
          v-model:tab="tab"
          v-model:tab-elements="tabElements"
          class="h-full w-full"
          :route="currentRoute"
          :tab-disabled="false"
        />
      </div>
      <div class="grid-section next flex flex-col p-4">
        <SlideContainer
          key="next"
          v-model:tab-elements="nextTabElements"
          class="h-full w-full"
          :tab="nextSlide.tab"
          :route="nextSlide.route"
          :tab-disabled="false"
        />
      </div>
      <div class="grid-section note">
        <NoteEditor class="w-full h-full p-4 overflow-auto" />
      </div>
      <div class="grid-section bottom">
        <NavControls />
      </div>
    </div>
    <div class="progress-bar">
      <div class="progress h-2px bg-primary transition-all" :style="{width: `${currentPage + 1 / total}%`}"></div>
    </div>
  </div>
  <SlidesOverview v-model="showOverview" />
</template>

<style lang="postcss" scoped>
.section-title {
  @apply px-4 py-2 font-xl;
}

.grid-container {
  @apply h-full w-full bg-gray-400 bg-opacity-15;
  display: grid;
  gap: 1px 1px;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: min-content 2fr 1fr min-content;
  grid-template-areas:
    "top top"
    "main main"
    "note next"
    "bottom bottom";
}

@screen md {
  .grid-container {
    grid-template-columns: 1fr 1.1fr 0.9fr;
    grid-template-rows: min-content 1fr 2fr min-content;
    grid-template-areas:
      "top top top"
      "main main next"
      "main main note"
      "bottom bottom bottom";
  }
}

.progress-bar {
  @apply fixed left-0 right-0 top-0;
}

.grid-section {
  @apply bg-main;

  &.top {
    grid-area: top;
  }
  &.main {
    grid-area: main;
  }
  &.next {
    grid-area: next;
  }
  &.note {
    grid-area: note;
  }
  &.bottom {
    grid-area: bottom;
  }
}
</style>
