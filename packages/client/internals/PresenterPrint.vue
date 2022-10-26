<script setup lang="ts">
import { computed } from '@vue/reactivity'
import { useHead } from '@vueuse/head'
import type { Slots } from 'vue'
import { h } from 'vue'
import { configs, themeVars } from '../env'
import { rawRoutes, total } from '../logic/nav'
import NoteViewer from './NoteViewer.vue'

// Global style to apply only within this component, must be defined inline.
// It doesn't work if placed in "scoped" component style, since the scoped attribute prevents to access elements outside the component.
function vStyle<Props>(props: Props, { slots }: { slots: Slots }) {
  if (slots.default)
    return h('style', slots.default())
}

useHead({ title: `Notes - ${configs.title}` })

const slidesWithNote = computed(() => rawRoutes
  .slice(0, -1)
  .map(route => route.meta?.slide)
  .filter(slide => slide !== undefined && slide.notesHTML !== ''))
</script>

<template>
  <vStyle>
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
  </vStyle>
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
          <NoteViewer :note-html="slide!.notesHTML" class="max-w-full" />
        </div>
        <hr v-if="index < slidesWithNote.length - 1" class="border-gray-400/50 mb-8">
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
@page {
  size: A4;
  margin-top: 1.5cm;
  margin-bottom: 1cm;
}
</style>
