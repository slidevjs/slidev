<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { ignorableWatch } from '@vueuse/core'
import { ref, computed, watch } from 'vue'
import { total, currentPage, currentRoute, nextRoute, tab, tabElements, currentSlideId } from '../logic/nav'
import { showOverview } from '../state'
import SlideContainer from './SlideContainer.vue'
import NavControls from './NavControls.vue'
import { useDynamicSlideInfo } from '../logic/note'
import SlidesOverview from './SlidesOverview.vue'
// @ts-expect-error
import configs from '/@slidev/configs'

useHead({
  title: configs.title ? `Presenter - ${configs.title} - Slidev` : 'Presenter - Slidev',
})

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

const { info, update } = useDynamicSlideInfo(currentSlideId)

const note = ref('')
let timer: any

const { ignoreUpdates } = ignorableWatch(
  note,
  (v) => {
    const id = currentSlideId.value
    clearTimeout(timer)
    timer = setTimeout(() => {
      update({ raw: null!, note: v }, id)
    }, 500)
  },
)

watch(
  info,
  (v) => {
    clearTimeout(timer)
    ignoreUpdates(() => {
      note.value = v?.note || ''
    })
  },
  { immediate: true, flush: 'sync' },
)
</script>

<template>
  <div class="grid-container">
    <div class="grid-section top flex">
      <img src="../assets/logo-title-horizontal.png" class="h-14 ml-2 py-2 my-auto" />
      <div class="flex-auto" />
      <div class="px-4 my-auto">
        {{ currentPage + 1 }} / {{ total }}
      </div>
    </div>
    <div class="grid-section main flex flex-col p-4">
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
      <textarea
        v-model="note"
        class="w-full h-full p-4 resize-none overflow-auto outline-none bg-transparent"
        placeholder="No notes for this slide"
      />
    </div>
    <div class="grid-section bottom">
      <NavControls mode="persist" />
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
  grid-template-columns: 1fr 1.1fr 0.9fr;
  grid-template-rows: min-content 1fr 2fr min-content;
  gap: 1px 1px;
  grid-template-areas:
    "top top top"
    "main main next"
    "main main note"
    "bottom bottom bottom";
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
