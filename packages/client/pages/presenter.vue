<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed, reactive, ref, shallowRef, watch, watchEffect } from 'vue'
import { useMouse, useWindowFocus } from '@vueuse/core'
import { useSwipeControls } from '../composables/useSwipeControls'
import { decreasePresenterFontSize, increasePresenterFontSize, presenterNotesFontSize, showEditor, showOverview, showPresenterCursor } from '../state'
import { configs } from '../env'
import { sharedState } from '../state/shared'
import { registerShortcuts } from '../logic/shortcuts'
import { getSlideClass } from '../utils'
import { useTimer } from '../logic/utils'
import { createFixedClicks } from '../composables/useClicks'
import SlideWrapper from '../internals/SlideWrapper.vue'
import SlideContainer from '../internals/SlideContainer.vue'
import NavControls from '../internals/NavControls.vue'
import QuickOverview from '../internals/QuickOverview.vue'
import NoteEditable from '../internals/NoteEditable.vue'
import NoteStatic from '../internals/NoteStatic.vue'
import Goto from '../internals/Goto.vue'
import SlidesShow from '../internals/SlidesShow.vue'
import DrawingControls from '../internals/DrawingControls.vue'
import IconButton from '../internals/IconButton.vue'
import ClicksSlider from '../internals/ClicksSlider.vue'
import { useNav } from '../composables/useNav'
import { useDrawings } from '../composables/useDrawings'
import PresenterTemplate from '#slidev/page-templates/presenter'

const main = ref<HTMLDivElement>()

registerShortcuts()
useSwipeControls(main)

const {
  clicksContext,
  currentSlideNo,
  currentSlideRoute,
  hasNext,
  nextRoute,
  slides,
  queryClicks,
  getPrimaryClicks,
  total,
} = useNav()
const { isDrawing } = useDrawings()

const slideTitle = configs.titleTemplate.replace('%s', configs.title || 'Slidev')
useHead({
  title: `Presenter - ${slideTitle}`,
})

const notesEditing = ref(false)

const { timer, resetTimer } = useTimer()

const clicksCtxMap = computed(() => slides.value.map(route => createFixedClicks(route)))
const nextFrame = computed(() => {
  if (clicksContext.value.current < clicksContext.value.total)
    return [currentSlideRoute.value!, clicksContext.value.current + 1] as const
  else if (hasNext.value)
    return [nextRoute.value!, 0] as const
  else
    return null
})

const nextFrameClicksCtx = computed(() => {
  return nextFrame.value && clicksCtxMap.value[nextFrame.value[0].no - 1]
})

watch(
  [currentSlideRoute, queryClicks],
  () => {
    if (nextFrameClicksCtx.value)
      nextFrameClicksCtx.value.current = nextFrame.value![1]
  },
  { immediate: true },
)

const SideEditor = shallowRef<any>()
if (__DEV__ && __SLIDEV_FEATURE_EDITOR__)
  import('../internals/SideEditor.vue').then(v => SideEditor.value = v.default)

// sync presenter cursor
const mouse = reactive(useMouse())
const focus = useWindowFocus()
watchEffect(() => {
  const slidesContainer = main.value?.querySelector('slidev-slide-content')

  if (!slidesContainer || !focus.value || isDrawing.value || !showPresenterCursor.value)
    return undefined

  const rect = slidesContainer.getBoundingClientRect()
  const x = (mouse.x - rect.left) / rect.width * 100
  const y = (mouse.y - rect.top) / rect.height * 100

  if (x < 0 || x > 100 || y < 0 || y > 100)
    return undefined

  sharedState.cursor = { x, y }
})
</script>

<template>
  <PresenterTemplate>
    <template #this-slide="attrs">
      <SlideContainer is-main v-bind="attrs" @update:slide-element="el => (main = el)">
        <SlidesShow render-context="presenter" />
      </SlideContainer>
    </template>
    <template v-if="nextFrame && nextFrameClicksCtx" #next-slide="attrs">
      <SlideContainer v-bind="attrs">
        <SlideWrapper
          :is="nextFrame[0].component!"
          :key="nextFrame[0].no"
          :clicks-context="nextFrameClicksCtx"
          :class="getSlideClass(nextFrame[0])"
          :route="nextFrame[0]"
          render-context="previewNext"
        />
      </SlideContainer>
    </template>
    <template #notes="attrs">
      <div v-if="__DEV__ && __SLIDEV_FEATURE_EDITOR__ && SideEditor && showEditor" class="of-auto" v-bind="attrs">
        <SideEditor />
      </div>
      <div v-else class="grid grid-rows-[1fr_min-content] overflow-hidden" v-bind="attrs">
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
    </template>
    <template #clicks-slider="attrs">
      <ClicksSlider
        :key="currentSlideRoute?.no"
        :clicks-context="getPrimaryClicks(currentSlideRoute)"
        v-bind="attrs"
      />
    </template>
    <template #nav-controls="attrs">
      <NavControls :persist="true" v-bind="attrs" />
    </template>
    <template #timer="attrs">
      <div class="flex items-center" v-bind="attrs">
        <div
          class="timer-btn relative w-22px h-22px cursor-pointer text-lg"
          opacity="50 hover:100"
          @click="resetTimer"
        >
          <carbon:time class="absolute" />
          <carbon:renew class="absolute opacity-0" />
        </div>
        <div class="text-2xl pl-2 pr-6 tabular-nums">
          {{ timer }}
        </div>
      </div>
    </template>
    <template #progress-bar="attrs">
      <div
        class="h-3px bg-primary transition-all"
        :style="{ width: `${(currentSlideNo - 1) / (total - 1) * 100}%` }"
        v-bind="attrs"
      />
    </template>
    <template #floating>
      <DrawingControls v-if="__SLIDEV_FEATURE_DRAWINGS__" />
      <Goto />
      <QuickOverview v-model="showOverview" />
    </template>
  </PresenterTemplate>
</template>

<style scoped>
.timer-btn:hover > :first-child {
  opacity: 0;
}
.timer-btn:hover > :last-child {
  opacity: 1;
}
</style>
