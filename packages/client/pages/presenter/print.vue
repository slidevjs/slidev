<script setup lang="ts">
import { computed } from 'vue'
import { useStyleTag } from '@vueuse/core'
import { useHead } from '@unhead/vue'
import { useNav } from '../../composables/useNav'
import { configs } from '../../env'
import NoteDisplay from '../../internals/NoteDisplay.vue'

const { slides, total } = useNav()

useStyleTag(`
@page {
  size: A4;
  margin-top: 1.5cm;
  margin-bottom: 1cm;
}
* {
  -webkit-print-color-adjust: exact;
}
html,
html body,
html #app,
html #page-root {
  height: auto;
  overflow: auto !important;
}
`)

useHead({
  title: `Notes - ${configs.title}`,
})

const slidesWithNote = computed(() => slides.value
  .map(route => route.meta?.slide)
  .filter(slide => slide !== undefined && slide.noteHTML !== ''))
</script>

<template>
  <div id="page-root">
    <div class="m-4">
      <div class="mb-10">
        <h1 class="text-4xl font-bold mt-2">
          {{ configs.title }}
        </h1>
        <div class="opacity-50">
          {{ new Date().toLocaleString() }}
        </div>
      </div>

      <div v-for="(slide, index) of slidesWithNote" :key="index" class="flex flex-col gap-4 break-inside-avoid-page">
        <div>
          <h2 class="text-lg">
            <div class="font-bold flex gap-2">
              <div class="opacity-50">
                {{ slide?.no }}/{{ total }}
              </div>
              {{ slide?.title }}
              <div class="flex-auto" />
            </div>
          </h2>
          <NoteDisplay
            :note-html="slide!.noteHTML"
            class="max-w-full"
          />
        </div>
        <hr v-if="index < slidesWithNote.length - 1" class="border-main mb-8">
      </div>
    </div>
  </div>
</template>
