<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { configs } from '../env'
import { sharedState } from '../state/shared'
import { total } from '../logic/nav'
import { rawRoutes } from '../routes'
import NoteViewer from './NoteViewer.vue'

const slideTitle = configs.titleTemplate.replace('%s', configs.title || 'Slidev')
useHead({
  title: `Notes - ${slideTitle}`,
})

const fontSize = useLocalStorage('slidev-notes-font-size', 18)
const pageNo = computed(() => sharedState.lastUpdate?.type === 'viewer' ? sharedState.viewerPage : sharedState.page)
const route = computed(() => rawRoutes.find(i => i.path === `${pageNo.value}`))
const note = computed(() => route.value?.meta?.slide?.note)
const noteHtml = computed(() => route.value?.meta?.slide?.noteHTML)

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
      <NoteViewer
        v-if="note"
        :note="note"
        :note-html="noteHtml"
      />
      <div v-else class="prose overflow-auto outline-none opacity-50">
        <p>
          No notes for Slide {{ pageNo }}.
        </p>
      </div>
    </div>
    <div class="flex-none">
      <div class="flex gap-1 justify-center items-center">
        <button class="icon-btn" @click="increaseFontSize">
          <carbon:add />
        </button>
        Font Size
        <button class="icon-btn" @click="decreaseFontSize">
          <carbon:subtract />
        </button>
      </div>
      <div class="p2 text-center">
        {{ pageNo }} / {{ total }}
      </div>
    </div>
  </div>
</template>
