<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { computed } from '@vue/reactivity'
import { rawRoutes, total } from '../logic/nav'
import { configs, themeVars } from '../env'
import NoteViewer from './NoteViewer.vue'

useHead({ title: `Notes - ${configs.title}` })

const slidesWithNote = computed(() => rawRoutes
  .slice(0, -1)
  .map(route => route.meta?.slide)
  .filter(slide => slide !== undefined && slide.notesHTML !== ''))
</script>

<template>
  <div id="page-root" :style="themeVars">
    <div class="m-4">
      <div class="mb-10">
        <h1 class="text-4xl font-bold mt-2">
          {{ configs.title }}
        </h1>
        <div class="opacity-50">
          {{ new Date().toLocaleString() }}
        </div>
      </div>

      <div v-for="(slide, index) of slidesWithNote" :key="index" class="flex flex-col gap-4">
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
          <NoteViewer :note-html="slide!.notesHTML" class="max-w-full" />
        </div>
        <hr v-if="index < slidesWithNote.length - 1" class="border-gray-400/50 mb-8">
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
@page {
  size: A4;
}
</style>
