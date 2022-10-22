<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { rawRoutes, total } from '../logic/nav'
import { configs, themeVars } from '../env'
import NoteViewer from './NoteViewer.vue'

const slideTitle = configs.titleTemplate.replace('%s', configs.title || 'Slidev')
useHead({ title: `Presenter - ${slideTitle}` })

const slidesWithNote = rawRoutes
  .slice(0, -1)
  .map(route => route.meta?.slide)
  .filter(slide => slide !== undefined && slide.notesHTML !== '')
</script>

<template>
  <div id="page-root" :style="themeVars">
    <div class="m-4">
      <h1 class="text-4xl font-bold mt-2 mb-4">
        {{ slideTitle }}
      </h1>
      <div v-for="(slide, index) of slidesWithNote" :key="index" class="flex flex-col">
        <span class="mb-2"><b>Slide:</b> {{ slide!.no }}/{{ total }}</span>
        <NoteViewer :note-html="slide!.notesHTML" class="max-w-full border rounded-lg p-2 mb-2" />
        <hr v-if="index < slidesWithNote.length - 1" class="border-gray-400 m-4">
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
@page {
  size: A4;
}
</style>
