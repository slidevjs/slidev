<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { createClicksContextBase } from '../composables/useClicks'
import { useNav } from '../composables/useNav'
import { slidesTitle } from '../env'
import ClicksSlider from '../internals/ClicksSlider.vue'
import CurrentProgressBar from '../internals/CurrentProgressBar.vue'
import IconButton from '../internals/IconButton.vue'
import Modal from '../internals/Modal.vue'
import NoteDisplay from '../internals/NoteDisplay.vue'
import TimerBar from '../internals/TimerBar.vue'
import { fullscreen } from '../state'
import { sharedState } from '../state/shared'

useHead({ title: `Notes - ${slidesTitle}` })

const { slides, total } = useNav()
const { isFullscreen, toggle: toggleFullscreen } = fullscreen

const scroller = ref<HTMLDivElement>()
const fontSize = useLocalStorage('slidev-notes-font-size', 18)
const pageNo = computed(() => sharedState.page)
const showHelp = ref(false)
const currentRoute = computed(() => slides.value.find(i => i.no === pageNo.value))

watch(pageNo, () => {
  scroller.value?.scrollTo({ left: 0, top: 0, behavior: 'smooth' })
  window.scrollTo({ left: 0, top: 0, behavior: 'smooth' })
})

function increaseFontSize() {
  fontSize.value = fontSize.value + 1
}

function decreaseFontSize() {
  fontSize.value = fontSize.value - 1
}

const clicksContext = computed(() => {
  const clicks = sharedState.clicks
  const total = sharedState.clicksTotal
  return createClicksContextBase(ref(clicks), undefined, total)
})
</script>

<template>
  <Modal v-model="showHelp" class="px-6 py-4 flex flex-col gap-2">
    <div class="flex gap-2 text-xl">
      <div class="i-carbon:information my-auto" /> Help
    </div>
    <div class="prose dark:prose-invert">
      <p>This is the hands-free live notes viewer.</p>
      <p>It's designed to be used in a separate view or device. The progress is controlled by and auto synced with the main presenter or slide.</p>
    </div>
    <div class="flex my-1">
      <button class="slidev-form-button" @click="showHelp = false">
        Close
      </button>
    </div>
  </Modal>
  <div class="h-full flex flex-col">
    <CurrentProgressBar :clicks-context="clicksContext" :current="pageNo" />
    <TimerBar />
    <div
      ref="scroller"
      class="px-5 py-3 flex-auto h-full overflow-auto"
      :style="{ fontSize: `${fontSize}px` }"
    >
      <NoteDisplay
        :note="currentRoute?.meta.slide.note"
        :note-html="currentRoute?.meta.slide.noteHTML"
        :placeholder="`No notes for Slide ${pageNo}.`"
        :clicks-context="clicksContext"
        :auto-scroll="true"
      />
    </div>
    <div class="flex-none border-t border-main" px3 py2>
      <ClicksSlider :clicks-context="clicksContext" readonly />
    </div>
    <div class="flex-none border-t border-main">
      <div class="flex gap-1 items-center px-6 py-3">
        <IconButton :title="isFullscreen ? 'Close fullscreen' : 'Enter fullscreen'" @click="toggleFullscreen">
          <div v-if="isFullscreen" class="i-carbon:minimize" />
          <div v-else class="i-carbon:maximize" />
        </IconButton>
        <IconButton title="Increase font size" @click="increaseFontSize">
          <div class="i-carbon:zoom-in" />
        </IconButton>
        <IconButton title="Decrease font size" @click="decreaseFontSize">
          <div class="i-carbon:zoom-out" />
        </IconButton>
        <IconButton title="Edit notes" to="/notes-edit" target="_blank">
          <div class="i-carbon:edit" />
        </IconButton>
        <IconButton title="Help" class="rounded-full" @click="showHelp = true">
          <div class="i-carbon:help" />
        </IconButton>
        <div class="flex-auto" />
        <div class="px2 my-auto">
          <span class="text-lg">{{ pageNo }}</span>
          <span class="opacity-50 text-sm"> / {{ total }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
