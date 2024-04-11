<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed, ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { slideTitle } from '../env'
import { sharedState } from '../state/shared'
import { fullscreen } from '../state'
import { useNav } from '../composables/useNav'
import NoteDisplay from '../internals/NoteDisplay.vue'
import IconButton from '../internals/IconButton.vue'
import NotesTemplate from '#slidev/page-templates/notes'

useHead({
  title: `Notes - ${slideTitle}`,
})

const { slides, total } = useNav()
const { isFullscreen, toggle: toggleFullscreen } = fullscreen

const scroller = ref<HTMLDivElement>()
const fontSize = useLocalStorage('slidev-notes-font-size', 18)
const pageNo = computed(() => sharedState.lastUpdate?.type === 'viewer' ? sharedState.viewerPage : sharedState.page)
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
</script>

<template>
  <NotesTemplate>
    <template #progress-bar="attrs">
      <div
        class="h-3px bg-primary transition-all duration-500"
        :style="{ width: `${(pageNo - 1) / (total - 1) * 100 + 1}%` }"
        v-bind="attrs"
      />
    </template>
    <template #content="attrs">
      <div
        ref="scroller"
        class="flex-auto h-full overflow-auto"
        :style="{ fontSize: `${fontSize}px` }"
        v-bind="attrs"
      >
        <NoteDisplay
          :note="currentRoute?.meta?.slide?.note"
          :note-html="currentRoute?.meta?.slide?.noteHTML"
          :placeholder="`No notes for Slide ${pageNo}.`"
          :clicks-context="currentRoute?.meta?.__clicksContext"
          :auto-scroll="true"
        />
      </div>
    </template>
    <template #controls="attrs">
      <div v-bind="attrs">
        <IconButton :title="isFullscreen ? 'Close fullscreen' : 'Enter fullscreen'" @click="toggleFullscreen">
          <carbon:minimize v-if="isFullscreen" />
          <carbon:maximize v-else />
        </IconButton>
        <IconButton title="Increase font size" @click="increaseFontSize">
          <carbon:zoom-in />
        </IconButton>
        <IconButton title="Decrease font size" @click="decreaseFontSize">
          <carbon:zoom-out />
        </IconButton>
      </div>
    </template>
    <template #slide-no="attrs">
      <div v-bind="attrs">
        {{ pageNo }} / {{ total }}
      </div>
    </template>
  </NotesTemplate>
</template>
