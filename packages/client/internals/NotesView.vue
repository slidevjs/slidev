<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { configs } from '../env'
import { sharedState } from '../state/shared'
import { fullscreen } from '../state'
import { total } from '../logic/nav'
import { rawRoutes } from '../routes'
import NoteDisplay from './NoteDisplay.vue'

const slideTitle = configs.titleTemplate.replace('%s', configs.title || 'Slidev')
useHead({
  title: `Notes - ${slideTitle}`,
})

const { isFullscreen, toggle: toggleFullscreen } = fullscreen

const fontSize = useLocalStorage('slidev-notes-font-size', 18)
const pageNo = computed(() => sharedState.lastUpdate?.type === 'viewer' ? sharedState.viewerPage : sharedState.page)
const currentRoute = computed(() => rawRoutes.find(i => i.path === `${pageNo.value}`))
const nextRoute = computed(() => rawRoutes.find(i => i.path === `${pageNo.value + 1}`))

function increaseFontSize() {
  fontSize.value = fontSize.value + 1
}

function decreaseFontSize() {
  fontSize.value = fontSize.value - 1
}
</script>

<template>
  <div
    class="fixed top-0 left-0 h-2px bg-teal-500 transition-all duration-500"
    :style="{ width: `${(pageNo - 1) / total * 100}%` }"
  />
  <div class="h-full flex flex-col">
    <div
      class="px-5 flex-auto h-full overflow-auto"
      :style="{ fontSize: `${fontSize}px` }"
    >
      <NoteDisplay
        :note="currentRoute?.meta?.slide?.note"
        :note-html="currentRoute?.meta?.slide?.noteHTML"
        :placeholder="`No notes for Slide ${pageNo}.`"
      />
    </div>
    <div v-if="nextRoute" class="px-5 py-2 max-h-60 overflow-auto border-t border-gray-400 border-opacity-20">
      <NoteDisplay
        class="opacity-50"
        :note="nextRoute?.meta?.slide?.note"
        :note-html="nextRoute?.meta?.slide?.noteHTML"
        placeholder="No notes for next slide."
      />
    </div>
    <div class="flex-none border-t border-gray-400 border-opacity-20">
      <div class="flex gap-1 items-center px-6 py-3">
        <button class="slidev-icon-btn" @click="toggleFullscreen">
          <carbon:minimize v-if="isFullscreen" />
          <carbon:maximize v-else />
        </button>
        <button class="slidev-icon-btn" @click="increaseFontSize">
          <carbon:zoom-in />
        </button>
        <button class="slidev-icon-btn" @click="decreaseFontSize">
          <carbon:zoom-out />
        </button>
        <div class="flex-auto" />
        <div class="p2 text-center">
          {{ pageNo }} / {{ total }}
        </div>
      </div>
    </div>
  </div>
</template>
