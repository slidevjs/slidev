<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { useMouse, useWindowFocus } from '@vueuse/core'
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { createFixedClicks } from '../composables/useClicks'
import { useDrawings } from '../composables/useDrawings'
import { useNav } from '../composables/useNav'
import { useSwipeControls } from '../composables/useSwipeControls'
import { useWakeLock } from '../composables/useWakeLock'
import { slidesTitle } from '../env'
import ClicksSlider from '../internals/ClicksSlider.vue'
import ContextMenu from '../internals/ContextMenu.vue'
import DrawingControls from '../internals/DrawingControls.vue'
import Goto from '../internals/Goto.vue'
import IconButton from '../internals/IconButton.vue'
import NavControls from '../internals/NavControls.vue'
import NoteEditable from '../internals/NoteEditable.vue'
import NoteStatic from '../internals/NoteStatic.vue'
import QuickOverview from '../internals/QuickOverview.vue'
import SlideContainer from '../internals/SlideContainer.vue'
import SlidesShow from '../internals/SlidesShow.vue'
import SlideWrapper from '../internals/SlideWrapper.vue'
import { onContextMenu } from '../logic/contextMenu'
import { registerShortcuts } from '../logic/shortcuts'
import { useTimer } from '../logic/utils'
import { decreasePresenterFontSize, increasePresenterFontSize, presenterLayout, presenterNotesFontSize, showEditor, showPresenterCursor } from '../state'
import { sharedState } from '../state/shared'

const main = ref<HTMLDivElement>()

registerShortcuts()
useSwipeControls(main)
if (__SLIDEV_FEATURE_WAKE_LOCK__)
  useWakeLock()

const {
  clicksContext,
  currentSlideNo,
  currentSlideRoute,
  hasNext,
  nextRoute,
  slides,
  getPrimaryClicks,
  total,
} = useNav()
const { isDrawing } = useDrawings()

useHead({ title: `Presenter - ${slidesTitle}` })

const notesEditing = ref(false)

const { timer, resetTimer } = useTimer()

const clicksCtxMap = computed(() => slides.value.map(route => createFixedClicks(route)))
const nextFrame = computed(() => {
  if (clicksContext.value.current < clicksContext.value.total)
    return [currentSlideRoute.value!, clicksContext.value.current + 1] as const
  else if (hasNext.value)
    return [nextRoute.value, 0] as const
  else
    return null
})

const nextFrameClicksCtx = computed(() => {
  return nextFrame.value && clicksCtxMap.value[nextFrame.value[0].no - 1]
})

watch(
  nextFrame,
  () => {
    if (nextFrameClicksCtx.value && nextFrame.value)
      nextFrameClicksCtx.value.current = nextFrame.value[1]
  },
  { immediate: true },
)

const SideEditor = shallowRef<any>()
if (__DEV__ && __SLIDEV_FEATURE_EDITOR__)
  import('../internals/SideEditor.vue').then(v => SideEditor.value = v.default)

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
      <div ref="main" class="relative grid-section main flex flex-col">
        <SlideContainer
          key="main"
          class="p-2 lg:p-4 flex-auto"
          is-main
          @contextmenu="onContextMenu"
        >
          <SlidesShow render-context="presenter" />
        </SlideContainer>
        <ClicksSlider
          :key="currentSlideRoute?.no"
          :clicks-context="getPrimaryClicks(currentSlideRoute)"
          class="w-full pb2 px4 flex-none"
        />
        <div class="absolute left-0 top-0 bg-main border-b border-r border-main px2 py1 op50 text-sm">
          Current
        </div>
      </div>
      <div class="relative grid-section next flex flex-col p-2 lg:p-4">
        <SlideContainer v-if="nextFrame && nextFrameClicksCtx" key="next">
          <SlideWrapper
            :key="nextFrame[0].no"
            :clicks-context="nextFrameClicksCtx"
            :route="nextFrame[0]"
            render-context="previewNext"
          />
        </SlideContainer>
        <div v-else class="h-full flex justify-center items-center">
          <div class="text-gray-500">
            End of the presentation
          </div>
        </div>
        <div class="absolute left-0 top-0 bg-main border-b border-r border-main px2 py1 op50 text-sm">
          Next
        </div>
      </div>
      <div v-if="SideEditor && showEditor" class="grid-section note of-auto">
        <SideEditor />
      </div>
      <div v-else class="grid-section note grid grid-rows-[1fr_min-content] overflow-hidden">
        <NoteEditable
          v-if="__DEV__"
          :key="`edit-${currentSlideNo}`"
          v-model:editing="notesEditing"
          :no="currentSlideNo"
          class="w-full max-w-full h-full overflow-auto p-2 lg:p-4"
          :clicks-context="clicksContext"
          :style="{ fontSize: `${presenterNotesFontSize}em` }"
        />
        <NoteStatic
          v-else
          :key="`static-${currentSlideNo}`"
          :no="currentSlideNo"
          class="w-full max-w-full h-full overflow-auto p-2 lg:p-4"
          :style="{ fontSize: `${presenterNotesFontSize}em` }"
          :clicks-context="clicksContext"
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
      <div class="grid-section bottom flex">
        <NavControls :persist="true" />
        <div flex-auto />
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
      <DrawingControls v-if="__SLIDEV_FEATURE_DRAWINGS__" />
    </div>
    <div class="progress-bar">
      <div
        class="progress h-3px bg-primary transition-all"
        :style="{ width: `${(currentSlideNo - 1) / (total - 1) * 100 + 1}%` }"
      />
    </div>
  </div>
  <Goto />
  <QuickOverview />
  <ContextMenu />
</template>

<style scoped>
.slidev-presenter {
  --slidev-controls-foreground: current;
}

.timer-btn:hover > :first-child {
  opacity: 0;
}
.timer-btn:hover > :last-child {
  opacity: 1;
}

.grid-container {
  --uno: bg-gray/20;
  height: 100%;
  width: 100%;
  display: grid;
  gap: 1px 1px;
}

.grid-container.layout1 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 2fr 1fr min-content;
  grid-template-areas:
    'main main'
    'note next'
    'bottom bottom';
}

.grid-container.layout2 {
  grid-template-columns: 3fr 2fr;
  grid-template-rows: 2fr 1fr min-content;
  grid-template-areas:
    'note main'
    'note next'
    'bottom bottom';
}

@media (max-aspect-ratio: 3/5) {
  .grid-container.layout1 {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr 1fr min-content;
    grid-template-areas:
      'main'
      'note'
      'next'
      'bottom';
  }
}

@media (min-aspect-ratio: 1/1) {
  .grid-container.layout1 {
    grid-template-columns: 1fr 1.1fr 0.9fr;
    grid-template-rows: 1fr 2fr min-content;
    grid-template-areas:
      'main main next'
      'main main note'
      'bottom bottom bottom';
  }
}

.progress-bar {
  --uno: fixed left-0 right-0 top-0;
}

.grid-section {
  --uno: bg-main;
}

.grid-section.top {
  grid-area: top;
}
.grid-section.main {
  grid-area: main;
}
.grid-section.next {
  grid-area: next;
}
.grid-section.note {
  grid-area: note;
}
.grid-section.bottom {
  grid-area: bottom;
}
</style>
