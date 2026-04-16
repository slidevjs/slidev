<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { useEventListener, useLocalStorage, useMediaQuery, useMouse, useWindowFocus } from '@vueuse/core'
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { createClicksContextBase } from '../composables/useClicks'
import { useDrawings } from '../composables/useDrawings'
import { useNav } from '../composables/useNav'
import { useSwipeControls } from '../composables/useSwipeControls'
import { useWakeLock } from '../composables/useWakeLock'
import { slidesTitle } from '../env'
import ClicksSlider from '../internals/ClicksSlider.vue'
import ContextMenu from '../internals/ContextMenu.vue'
import CurrentProgressBar from '../internals/CurrentProgressBar.vue'
import DrawingControls from '../internals/DrawingControls.vue'
import Goto from '../internals/Goto.vue'
import IconButton from '../internals/IconButton.vue'
import NavControls from '../internals/NavControls.vue'
import NoteEditable from '../internals/NoteEditable.vue'
import NoteStatic from '../internals/NoteStatic.vue'
import QuickOverview from '../internals/QuickOverview.vue'
import ScreenCaptureMirror from '../internals/ScreenCaptureMirror.vue'
import SegmentControl from '../internals/SegmentControl.vue'
import SlideContainer from '../internals/SlideContainer.vue'
import SlidesShow from '../internals/SlidesShow.vue'
import SlideWrapper from '../internals/SlideWrapper.vue'
import TimerBar from '../internals/TimerBar.vue'
import TimerInlined from '../internals/TimerInlined.vue'
import { onContextMenu } from '../logic/contextMenu'
import { registerShortcuts } from '../logic/shortcuts'
import { decreasePresenterFontSize, increasePresenterFontSize, presenterLayout, presenterNotesFontSize, showEditor, showPresenterCursor } from '../state'
import { sharedState } from '../state/shared'

const inFocus = useWindowFocus()
const main = ref<HTMLDivElement>()
const gridContainer = ref<HTMLDivElement>()
const noteSection = ref<HTMLDivElement>()
const bottomSection = ref<HTMLDivElement>()

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
} = useNav()
const { isDrawing } = useDrawings()

useHead({ title: `Presenter - ${slidesTitle}` })

const notesEditing = ref(false)

const clicksCtxMap = computed(() => slides.value.map((route) => {
  const clicks = ref(0)
  return {
    context: createClicksContextBase(clicks, route?.meta.slide?.frontmatter.clicksStart ?? 0, route?.meta.clicks),
    clicks,
  }
}))
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
      nextFrameClicksCtx.value.clicks.value = nextFrame.value[1]
  },
  { immediate: true },
)

const mainSlideMode = useLocalStorage<'slides' | 'mirror'>('slidev-presenter-main-slide-mode', 'slides')

// Resize state (persisted)
const notesWidth = useLocalStorage('slidev-presenter-notes-width', 360)
const notesRowSize = useLocalStorage('slidev-presenter-notes-row-size', 280)
const bottomSectionHeight = ref(0)
const isResizingNotes = ref(false)
const isResizingNotesRow = ref(false)
const resizeStartX = ref(0)
const resizeStartWidth = ref(360)
const resizeStartY = ref(0)
const resizeStartRowSize = ref(280)

const RESIZER_LIMITS = {
  minNotesWidth: 240,
  maxNotesWidth: 720,
  minNotesRowSize: 160,
  maxNotesWidthRatio: 0.7,
  maxNotesRowHeightRatio: 0.75,
}

const isLayout1Wide = useMediaQuery('(min-aspect-ratio: 1/1)')
const isLayout1Stacked = useMediaQuery('(max-aspect-ratio: 3/5)')
const isNotesOnRight = computed(() => presenterLayout.value === 1 && isLayout1Wide.value)
const isNotesResizable = computed(() => !(presenterLayout.value === 1 && isLayout1Stacked.value))
const isNotesRowResizable = computed(() =>
  (presenterLayout.value === 1 && !isLayout1Stacked.value) || presenterLayout.value === 2 || presenterLayout.value === 3,
)
const isNotesOnBottom = computed(() => presenterLayout.value === 1 && !isLayout1Stacked.value)

function clampNotesWidth(width: number) {
  if (!Number.isFinite(width))
    return RESIZER_LIMITS.minNotesWidth
  return Math.max(
    RESIZER_LIMITS.minNotesWidth,
    Math.min(RESIZER_LIMITS.maxNotesWidth, Math.round(width)),
  )
}

function updateNotesWidthFromPointer(clientX: number) {
  const container = gridContainer.value
  if (!container)
    return

  const rect = container.getBoundingClientRect()
  const deltaX = clientX - resizeStartX.value
  const proposedWidth = isNotesOnRight.value
    ? resizeStartWidth.value - deltaX
    : resizeStartWidth.value + deltaX
  const nextWidth = clampNotesWidth(proposedWidth)
  const maxByViewport = Math.round(rect.width * RESIZER_LIMITS.maxNotesWidthRatio)
  notesWidth.value = Math.min(nextWidth, Math.max(RESIZER_LIMITS.minNotesWidth, maxByViewport))
}

function onNotesResizeStart(e: PointerEvent) {
  if (!isNotesResizable.value)
    return
  if (e.button !== 0)
    return
  e.preventDefault()
  resizeStartX.value = e.clientX
  resizeStartWidth.value = notesWidth.value
  isResizingNotes.value = true
}

function clampNotesRowSize(size: number) {
  if (!Number.isFinite(size))
    return RESIZER_LIMITS.minNotesRowSize
  return Math.max(RESIZER_LIMITS.minNotesRowSize, Math.round(size))
}

function updateNotesRowSizeFromPointer(clientY: number) {
  const container = gridContainer.value
  if (!container)
    return

  const rect = container.getBoundingClientRect()
  const deltaY = clientY - resizeStartY.value
  const proposed = isNotesOnBottom.value
    ? resizeStartRowSize.value - deltaY
    : resizeStartRowSize.value + deltaY
  const maxByViewport = Math.round(rect.height * RESIZER_LIMITS.maxNotesRowHeightRatio)
  notesRowSize.value = Math.min(clampNotesRowSize(proposed), Math.max(RESIZER_LIMITS.minNotesRowSize, maxByViewport))
}

function onNotesRowResizeStart(e: PointerEvent) {
  if (!isNotesRowResizable.value)
    return
  if (e.button !== 0)
    return
  e.preventDefault()

  // In layout 2, notesRowSize controls the top section (main slide) height
  // In other layouts, it represents the notes area height
  const currentHeight = presenterLayout.value === 2
    ? main.value?.getBoundingClientRect().height
    : noteSection.value?.getBoundingClientRect().height
  resizeStartY.value = e.clientY
  resizeStartRowSize.value = clampNotesRowSize(currentHeight ?? notesRowSize.value)
  isResizingNotesRow.value = true
}

function updateBottomSectionHeight() {
  const element = bottomSection.value
  if (!element)
    return
  bottomSectionHeight.value = Math.round(element.getBoundingClientRect().height)
}

function stopResizing() {
  isResizingNotes.value = false
  isResizingNotesRow.value = false
}

function syncResizerLayoutState() {
  updateBottomSectionHeight()
  normalizeResizerState()
}

useEventListener(window, 'pointermove', (e) => {
  if (isResizingNotes.value)
    updateNotesWidthFromPointer(e.clientX)
  if (isResizingNotesRow.value)
    updateNotesRowSizeFromPointer(e.clientY)
})

useEventListener(window, 'pointerup', stopResizing)
useEventListener(window, 'pointercancel', stopResizing)

onMounted(() => {
  syncResizerLayoutState()
})

useEventListener(window, 'resize', () => {
  syncResizerLayoutState()
})

function normalizeResizerState() {
  notesWidth.value = clampNotesWidth(notesWidth.value)
  notesRowSize.value = clampNotesRowSize(notesRowSize.value)

  const container = gridContainer.value
  if (!container)
    return

  const rect = container.getBoundingClientRect()
  const maxWidth = Math.round(rect.width * RESIZER_LIMITS.maxNotesWidthRatio)
  const maxRowSize = Math.round(rect.height * RESIZER_LIMITS.maxNotesRowHeightRatio)

  notesWidth.value = Math.min(notesWidth.value, Math.max(RESIZER_LIMITS.minNotesWidth, maxWidth))
  notesRowSize.value = Math.min(notesRowSize.value, Math.max(RESIZER_LIMITS.minNotesRowSize, maxRowSize))
}

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
      if (!focus.value || isDrawing.value || !showPresenterCursor.value || !slidesContainer)
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
  <div class="bg-main h-full slidev-presenter grid grid-rows-[max-content_1fr] of-hidden">
    <div>
      <CurrentProgressBar />
      <TimerBar />
    </div>
    <div
      ref="gridContainer"
      class="grid-container"
      :class="`layout${presenterLayout}`"
      :style="{
        '--slidev-presenter-notes-width': `${notesWidth}px`,
        '--slidev-presenter-notes-row-size': `${notesRowSize}px`,
        '--slidev-presenter-bottom-height': `${bottomSectionHeight}px`,
      }"
    >
      <!-- Unified vertical resizer for wide layout -->
      <div
        v-if="isNotesResizable && isNotesOnRight"
        class="notes-vertical-resizer"
        role="separator"
        aria-orientation="vertical"
        title="Resize notes panel"
        @pointerdown="onNotesResizeStart"
      />
      <!-- Unified vertical resizer for layout 3 -->
      <div
        v-if="isNotesResizable && presenterLayout === 3"
        class="notes-vertical-resizer-left"
        role="separator"
        aria-orientation="vertical"
        title="Resize notes panel"
        @pointerdown="onNotesResizeStart"
      />
      <div ref="main" class="relative grid-section main flex flex-col">
        <div flex="~ gap-4 items-center" border="b main" p1>
          <span op50 px2>Current</span>
          <div flex-auto />
          <SegmentControl
            v-model="mainSlideMode"
            :options="[
              { label: 'Slides', value: 'slides' },
              { label: 'Screen Mirror', value: 'mirror' },
            ]"
          />
        </div>
        <template v-if="mainSlideMode === 'mirror'">
          <ScreenCaptureMirror />
        </template>

        <!-- We use v-show here to still infer the clicks context -->
        <SlideContainer
          v-show="mainSlideMode === 'slides'"
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
      </div>
      <div class="relative grid-section next flex flex-col p-2 lg:p-4">
        <div
          v-if="isNotesRowResizable && presenterLayout === 2"
          class="notes-row-resizer top-[-6px]"
          role="separator"
          aria-orientation="horizontal"
          title="Resize notes panel height"
          @pointerdown="onNotesRowResizeStart"
        />
        <SlideContainer v-if="nextFrame && nextFrameClicksCtx" key="next">
          <SlideWrapper
            :key="nextFrame[0].no"
            :clicks-context="nextFrameClicksCtx.context"
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
      <div ref="noteSection" class="relative grid-section note overflow-hidden">
        <div
          v-if="isNotesResizable && !isNotesOnRight && presenterLayout !== 3"
          class="notes-resizer right-[-6px]"
          role="separator"
          aria-orientation="vertical"
          title="Resize notes panel"
          @pointerdown="onNotesResizeStart"
        />
        <div
          v-if="isNotesRowResizable && presenterLayout !== 2"
          class="notes-row-resizer"
          :class="isNotesOnBottom ? 'top-[-6px]' : 'bottom-[-6px]'"
          role="separator"
          aria-orientation="horizontal"
          title="Resize notes panel height"
          @pointerdown="onNotesRowResizeStart"
        />

        <SideEditor v-if="SideEditor && showEditor" class="h-full" />

        <div v-else class="h-full grid grid-rows-[1fr_min-content]">
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
          <div border-t border-main />
          <div class="py-1 px-2 text-sm transition" :class="inFocus ? '' : 'op25'">
            <IconButton title="Increase font size" @click="increasePresenterFontSize">
              <div class="i-carbon:zoom-in" />
            </IconButton>
            <IconButton title="Decrease font size" @click="decreasePresenterFontSize">
              <div class="i-carbon:zoom-out" />
            </IconButton>
            <IconButton
              v-if="__DEV__"
              title="Edit Notes"
              @click="notesEditing = !notesEditing"
            >
              <div class="i-carbon:edit" />
            </IconButton>
          </div>
        </div>
      </div>
      <div ref="bottomSection" class="grid-section bottom flex">
        <NavControls :persist="true" class="transition" :class="inFocus ? '' : 'op25'" />
        <div flex-auto />
        <TimerInlined />
      </div>
      <DrawingControls v-if="__SLIDEV_FEATURE_DRAWINGS__" />
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

.grid-container {
  --slidev-presenter-notes-width: 360px;
  --slidev-presenter-notes-row-size: 280px;
  --uno: bg-gray/20 flex-1 of-hidden;
  display: grid;
  gap: 1px 1px;
}

.grid-container.layout1 {
  grid-template-columns: var(--slidev-presenter-notes-width) minmax(0, 1fr);
  grid-template-rows: minmax(0, 2fr) minmax(0, var(--slidev-presenter-notes-row-size)) min-content;
  grid-template-areas:
    'main main'
    'note next'
    'bottom bottom';
}

.grid-container.layout2 {
  grid-template-columns: var(--slidev-presenter-notes-width) minmax(0, 1fr);
  grid-template-rows: minmax(0, var(--slidev-presenter-notes-row-size)) minmax(0, 1fr) min-content;
  grid-template-areas:
    'note main'
    'note next'
    'bottom bottom';
}

@media (max-aspect-ratio: 3/5) {
  .grid-container.layout1 {
    grid-template-columns: 1fr;
    grid-template-rows: 2fr 1fr 1fr min-content;
    grid-template-areas:
      'main'
      'note'
      'next'
      'bottom';
  }
}

@media (min-aspect-ratio: 1/1) {
  .grid-container.layout1 {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr) var(--slidev-presenter-notes-width);
    grid-template-rows: minmax(0, 1fr) minmax(0, var(--slidev-presenter-notes-row-size)) min-content;
    grid-template-areas:
      'main main next'
      'main main note'
      'bottom bottom bottom';
  }
}

.grid-container.layout3 {
  grid-template-columns: var(--slidev-presenter-notes-width) minmax(0, 1fr);
  grid-template-rows: minmax(0, var(--slidev-presenter-notes-row-size)) minmax(0, 1fr) min-content;
  grid-template-areas:
    'note next'
    'main next'
    'bottom bottom';
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

.notes-resizer {
  position: absolute;
  top: 0;
  width: 12px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
  touch-action: none;
}

.notes-resizer::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  background-color: currentColor;
  opacity: 0.2;
  transform: translateX(-50%);
}

.notes-row-resizer {
  position: absolute;
  left: 0;
  width: 100%;
  height: 12px;
  cursor: row-resize;
  z-index: 10;
  touch-action: none;
}

.notes-row-resizer::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
  background-color: currentColor;
  opacity: 0.2;
  transform: translateY(-50%);
}

.notes-vertical-resizer {
  position: absolute;
  right: var(--slidev-presenter-notes-width);
  top: 0;
  bottom: var(--slidev-presenter-bottom-height, 0px);
  width: 12px;
  cursor: col-resize;
  z-index: 10;
  touch-action: none;
  transform: translateX(50%);
}

.notes-vertical-resizer::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  background-color: currentColor;
  opacity: 0.2;
  transform: translateX(-50%);
}

.notes-vertical-resizer-left {
  position: absolute;
  left: var(--slidev-presenter-notes-width);
  top: 0;
  bottom: var(--slidev-presenter-bottom-height, 0px);
  width: 12px;
  cursor: col-resize;
  z-index: 10;
  touch-action: none;
  transform: translateX(-50%);
}

.notes-vertical-resizer-left::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  background-color: currentColor;
  opacity: 0.2;
  transform: translateX(-50%);
}
</style>
