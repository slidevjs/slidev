<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useMouse, useWindowFocus } from '@vueuse/core'
import { clicksContext, currentPage, currentRoute, hasNext, nextRoute, queryClicks, rawRoutes, total, useSwipeControls } from '../logic/nav'
import { decreasePresenterFontSize, increasePresenterFontSize, presenterLayout, presenterNotesFontSize, showEditor, showOverview, showPresenterCursor } from '../state'
import { configs, themeVars } from '../env'
import { sharedState } from '../state/shared'
import { registerShortcuts } from '../logic/shortcuts'
import { getSlideClass } from '../utils'
import { useTimer } from '../logic/utils'
import { isDrawing } from '../logic/drawings'
import { useFixedClicks } from '../composables/useClicks'
import SlideWrapper from '../internals/SlideWrapper'
import SlideContainer from '../internals/SlideContainer.vue'
import NavControls from '../internals/NavControls.vue'
import SlidesOverview from '../internals/SlidesOverview.vue'
import NoteEditor from '../internals/NoteEditor.vue'
import NoteStatic from '../internals/NoteStatic.vue'
import Goto from '../internals/Goto.vue'
import SlidesShow from '../internals/SlidesShow.vue'
import DrawingControls from '../internals/DrawingControls.vue'
import IconButton from '../internals/IconButton.vue'

const main = ref<HTMLDivElement>()

registerShortcuts()
useSwipeControls(main)

const slideTitle = configs.titleTemplate.replace('%s', configs.title || 'Slidev')
useHead({
  title: `Presenter - ${slideTitle}`,
})

const notesEditing = ref(false)

const { timer, resetTimer } = useTimer()

const clicksCtxMap = rawRoutes.map(route => useFixedClicks(route))
const nextFrame = computed(() => {
  if (clicksContext.value.current < clicksContext.value.total)
    return [currentRoute.value!, clicksContext.value.current + 1] as const
  else if (hasNext.value)
    return [nextRoute.value!, 0] as const
  else
    return null
})
const nextFrameClicksCtx = computed(() => {
  return nextFrame.value && clicksCtxMap[+nextFrame.value[0].path - 1]
})
watch([currentRoute, queryClicks], () => {
  nextFrameClicksCtx.value && (nextFrameClicksCtx.value[0].value = nextFrame.value![1])
}, { immediate: true })

const Editor = shallowRef<any>()
if (__DEV__ && __SLIDEV_FEATURE_EDITOR__)
  import('../internals/Editor.vue').then(v => Editor.value = v.default)

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
    <div class="grid-container" :class="`layout${presenterLayout}`">
      <div class="grid-section top flex">
        <img src="../assets/logo-title-horizontal.png" class="ml-2 my-auto h-10 py-1 lg:h-14 lg:py-2" style="height: 3.5rem;" alt="Slidev logo">
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
            <SlidesShow render-context="presenter" />
          </template>
        </SlideContainer>
        <div class="context">
          current
        </div>
      </div>
      <div class="relative grid-section next flex flex-col p-2 lg:p-4" :style="themeVars">
        <SlideContainer
          v-if="nextFrame && nextFrameClicksCtx"
          key="next"
          class="h-full w-full"
        >
          <SlideWrapper
            :is="nextFrame[0].component as any"
            :key="nextFrame[0].path"
            :clicks-context="nextFrameClicksCtx[1]"
            :class="getSlideClass(nextFrame[0])"
            :route="nextFrame[0]"
            render-context="previewNext"
          />
        </SlideContainer>
        <div class="context">
          next
        </div>
      </div>
      <!-- Notes -->
      <div v-if="__DEV__ && __SLIDEV_FEATURE_EDITOR__ && Editor && showEditor" class="grid-section note of-auto">
        <Editor />
      </div>
      <div v-else class="grid-section note grid grid-rows-[1fr_min-content] overflow-hidden">
        <NoteEditor
          v-if="__DEV__"
          class="w-full max-w-full h-full overflow-auto p-2 lg:p-4"
          :editing="notesEditing"
          :style="{ fontSize: `${presenterNotesFontSize}em` }"
        />
        <NoteStatic
          v-else
          class="w-full max-w-full h-full overflow-auto p-2 lg:p-4"
          :style="{ fontSize: `${presenterNotesFontSize}em` }"
        />
        <div class="border-t border-main py-1 px-2 text-sm">
          <IconButton title="Increase font size" @click="increasePresenterFontSize">
            <carbon:zoom-in />
          </IconButton>
          <IconButton title="Decrease font size" @click="decreasePresenterFontSize">
            <carbon:zoom-out />
          </IconButton>
          <IconButton
            v-if="__DEV__"
            title="Edit Notes"
            @click="notesEditing = !notesEditing"
          >
            <carbon:edit />
          </IconButton>
        </div>
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
}

.grid-container.layout1 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: min-content 2fr 1fr min-content;
  grid-template-areas:
    "top top"
    "main main"
    "note next"
    "bottom bottom";
}

.grid-container.layout2 {
  grid-template-columns: 3fr 2fr;
  grid-template-rows: min-content 2fr 1fr min-content;
  grid-template-areas:
    "top top"
    "note main"
    "note next"
    "bottom bottom";
}

@media (max-aspect-ratio: 3/5) {
  .grid-container.layout1 {
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
  .grid-container.layout1 {
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
