<script setup lang="ts">
import type { ClicksContext, SlideRoute } from '@slidev/types'
import { useHead } from '@unhead/vue'
import { useStyleTag } from '@vueuse/core'
import { computed } from 'vue'
import { createFixedClicks } from '../../composables/useClicks'
import { useNav } from '../../composables/useNav'
import { CLICKS_MAX } from '../../constants'
import { configs } from '../../env'
import NoteDisplay from '../../internals/NoteDisplay.vue'
import SlideContainer from '../../internals/SlideContainer.vue'
import SlideWrapper from '../../internals/SlideWrapper.vue'
import { wordCount } from '../../logic/utils'

const cardWidth = 400

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
  title: `Overview - ${configs.title}`,
})

const { slides } = useNav()

const clicksContextMap = new WeakMap<SlideRoute, ClicksContext>()
function getClicksContext(route: SlideRoute) {
  if (!clicksContextMap.has(route))
    clicksContextMap.set(route, createFixedClicks(route, CLICKS_MAX))
  return clicksContextMap.get(route)!
}

const wordCounts = computed(() => slides.value.map(route => wordCount(route.meta?.slide?.note || '')))
const totalWords = computed(() => wordCounts.value.reduce((a, b) => a + b, 0))
</script>

<template>
  <div id="page-root">
    <div class="mx-4 mt-4 mb-2 flex items-baseline gap-4">
      <h1 class="text-3xl font-bold">
        {{ configs.title }}
      </h1>
      <div class="opacity-50 text-sm">
        {{ slides.length }} slides · {{ totalWords }} words · {{ new Date().toLocaleString() }}
      </div>
    </div>

    <div
      v-for="(route, idx) of slides"
      :key="route.no"
      class="flex gap-4 mx-4 py-3 border-t border-gray/20 break-inside-avoid-page"
    >
      <div class="shrink-0 flex flex-col items-center w-10">
        <div class="text-2xl opacity-25 font-mono">
          {{ idx + 1 }}
        </div>
      </div>
      <div class="shrink-0" :style="{ width: `${cardWidth}px` }">
        <div class="border rounded border-gray/20 overflow-hidden">
          <SlideContainer
            :key="route.no"
            :width="cardWidth"
            class="pointer-events-none"
          >
            <SlideWrapper
              :clicks-context="getClicksContext(route)"
              :route="route"
              render-context="overview"
            />
          </SlideContainer>
        </div>
      </div>
      <div class="flex-1 min-w-0 pt-1">
        <NoteDisplay
          v-if="route.meta?.slide?.noteHTML"
          :note-html="route.meta.slide.noteHTML"
          class="max-w-full text-sm"
          :clicks-context="getClicksContext(route)"
        />
        <div v-else class="opacity-30 italic text-sm">
          No notes for this slide
        </div>
        <div v-if="wordCounts[idx] > 0" class="opacity-30 text-xs mt-2">
          {{ wordCounts[idx] }} words
        </div>
      </div>
    </div>
  </div>
</template>
