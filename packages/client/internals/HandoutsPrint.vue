<script setup lang="ts">
import { useStyleTag } from '@vueuse/core'
import { useHead } from '@vueuse/head'
import { configs } from '../env'
import { rawRoutes } from '../logic/nav'
import NoteDisplay from './NoteDisplay.vue'
import HandoutPrintSlide from './HandoutPrintSlide.vue'

// @ts-expect-error virtual module
import GlobalHandout from '/@slidev/global-components/handout'

// @ts-expect-error virtual module
import GlobalHandoutCover from '/@slidev/global-components/handout-cover'

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

useHead({ title: `Notes - ${configs.title}` })
</script>

<template>
  <div id="page-root">
    <div class="m-4">
      <div v-if="true" id="print-container">
        <div id="print-content" class="max-h-full">
          <GlobalHandoutCover />
          <div v-for="(route, idx) of rawRoutes" :key="route.path" class=" break-after-page">
            <HandoutPrintSlide :route="route" class=" p-0 border-1 border-gray-700 max-w-full max-h-130" />

            <div class="mt-8 h-110 flex flex-col">
              <NoteDisplay
                v-if="route.meta?.slide!.noteHTML" :note-html="route.meta?.slide!.noteHTML"
                class="max-w-full grow"
              />
              <div v-else class="grow" />
              <div class="">
                <GlobalHandout />
              </div>
              <div class="text-right mt-3 text-xs">
                {{ idx + 1 }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
#print-content {
  @apply bg-main;
}

.print-slide-container {
  @apply relative overflow-hidden !break-after-avoid;
}
</style>
