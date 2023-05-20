<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useMouse, useWindowFocus } from '@vueuse/core'
import { clicks, clicksTotal, currentPage, currentRoute, hasNext, nextRoute, total, useSwipeControls } from '../logic/nav'
import { showOverview, showPresenterCursor } from '../state'
import { configs, themeVars } from '../env'
import { sharedState } from '../state/shared'
import { registerShortcuts } from '../logic/shortcuts'
import { getSlideClass } from '../utils'
import { useTimer } from '../logic/utils'
import { isDrawing } from '../logic/drawings'
import SlideContainer from './SlideContainer.vue'
import NavControls from './NavControls.vue'
import SlidesOverview from './SlidesOverview.vue'
import NoteEditor from './NoteEditor.vue'
import NoteStatic from './NoteStatic.vue'
import Goto from './Goto.vue'
import SlidesShow from './SlidesShow.vue'
import SlideWrapper from './SlideWrapper'
import DrawingControls from './DrawingControls.vue'

const main = ref<HTMLDivElement>()

registerShortcuts()
useSwipeControls(main)

const slideTitle = configs.titleTemplate.replace('%s', configs.title || 'Slidev')
useHead({
  title: `Presenter - ${slideTitle}`,
})

const { timer, resetTimer } = useTimer()

const nextTabElements = ref([])
const nextSlide = computed(() => {
  if (clicks.value < clicksTotal.value) {
    return {
      route: currentRoute.value,
      clicks: clicks.value + 1,
    }
  }
  else {
    if (hasNext.value) {
      return {
        route: nextRoute.value,
        clicks: 0,
      }
    }
    else {
      return null
    }
  }
})

// sync presenter cursor
onMounted(() => {
  const slidesContainer = main.value!.querySelector('#slide-content')!
  const mouse = reactive(useMouse())
  const focus = useWindowFocus()

  watch(
    () => {
      if (!focus.value || isDrawing.value || !showPresenterCursor.value)
        return undefined

      const rect = slidesContainer.getBoundingClientRect()
      const x = (mouse.x - rect.left) / rect.width * 100
      const y = (mouse.y - rect.top) / rect.height * 100

      if (x < 0 || x > 100 || y < 0 || y > 100)
        return undefined

      return { x, y }
    },
    (pos) => {
      sharedState.cursor = pos
    },
  )
})
</script>

<template>
  <div class="bg-main h-full slidev-presenter">
    <div class="grid-container">
      <div class="grid-section top flex">
        <img src="../assets/logo-title-horizontal.png" class="ml-2 my-auto h-10 py-1 lg:h-14 lg:py-2" style="height: 3.5rem;">
        <div class="flex-auto" />
        <div
          class="timer-btn my-auto relative w-22px h-22px cursor-pointer text-lg"
          opacity="50 hover:100"
          @click="resetTimer"
        >
          <carbon:time class="absolute" />
          <carbon:renew class="absolute opacity-0" />
        </div>
        <div class="text-2xl pl-2 pr-6 my-auto tabular-nums">
          {{ timer }}
        </div>
      </div>
      <div ref="main" class="relative grid-section main flex flex-col p-2 lg:p-4" :style="themeVars">
        <SlideContainer
          key="main"
          class="h-full w-full"
        >
          <template #default>
            <SlidesShow context="presenter" />
          </template>
        </SlideContainer>
        <div class="context">
          current
        </div>
      </div>
      <div class="relative grid-section next flex flex-col p-2 lg:p-4" :style="themeVars">
        <SlideContainer
          v-if="nextSlide"
          key="next"
          class="h-full w-full"
        >
          <SlideWrapper
            :is="nextSlide.route?.component as any"
            v-model:clicks-elements="nextTabElements"
            :clicks="nextSlide.clicks"
            :clicks-disabled="false"
            :class="getSlideClass(nextSlide.route)"
            :route="nextSlide.route"
            context="previewNext"
          />
        </SlideContainer>
        <div class="context">
          next
        </div>
      </div>
      <div class="grid-section note overflow-auto">
        <NoteEditor v-if="__DEV__" class="w-full max-w-full h-full overflow-auto p-2 lg:p-4" />
        <NoteStatic v-else class="w-full max-w-full h-full overflow-auto p-2 lg:p-4" />
      </div>
      <div class="grid-section bottom">
        <NavControls :persist="true" />
      </div>
      <DrawingControls v-if="__SLIDEV_FEATURE_DRAWINGS__" />
    </div>
    <div class="progress-bar">
      <div
        class="progress h-2px bg-primary transition-all"
        :style="{ width: `${(currentPage - 1) / (total - 1) * 100}%` }"
      />
    </div>
  </div>
  <Goto />
  <SlidesOverview v-model="showOverview" />
</template>

<style lang="postcss" scoped>
.slidev-presenter {
  --slidev-controls-foreground: current;
}

.timer-btn:hover {
  & > :first-child {
    @apply opacity-0;
  }
  & > :last-child {
    @apply opacity-100;
  }
}

.section-title {
  @apply px-4 py-2 text-xl;
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

@media (max-aspect-ratio: 3/5) {
  .grid-container {
    grid-template-columns: 1fr;
    grid-template-rows: min-content 1fr 1fr 1fr min-content;
    grid-template-areas:
      "top"
      "main"
      "note"
      "next"
      "bottom";
  }
}

@media (min-aspect-ratio: 1/1) {
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
  @apply fixed left-0 right-0 bottom-0;
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

.context {
  @apply absolute top-0 left-0 px-1 text-xs bg-gray-400 bg-opacity-50 opacity-75 rounded-br-md;
}
</style>
