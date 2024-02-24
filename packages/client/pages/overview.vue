<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { themeVars } from '../env'
import { rawRoutes } from '../logic/nav'
import { useFixedClicks } from '../composables/useClicks'
import { isColorSchemaConfigured, isDark, toggleDark } from '../logic/dark'
import { getSlideClass } from '../utils'
import SlideContainer from '../internals/SlideContainer.vue'
import SlideWrapper from '../internals/SlideWrapper'
import DrawingPreview from '../internals/DrawingPreview.vue'
import NoteDisplay from '../internals/NoteDisplay.vue'
import IconButton from '../internals/IconButton.vue'

const cardWidth = 450

const blocks: Map<number, HTMLElement> = reactive(new Map())
const activeBlocks = ref<number[]>([])

function isElementInViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  const delta = 20
  return (
    rect.top >= 0 - delta
    && rect.left >= 0 - delta
    && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + delta
    && rect.right <= (window.innerWidth || document.documentElement.clientWidth) + delta
  )
}

function checkActiveBlocks() {
  const active: number[] = []
  Array.from(blocks.entries())
    .forEach(([idx, el]) => {
      if (isElementInViewport(el))
        active.push(idx)
    })
  activeBlocks.value = active
}

function openSlideInNewTab(path: string) {
  const a = document.createElement('a')
  a.target = '_blank'
  a.href = path
  a.click()
}

function scrollToSlide(idx: number) {
  const el = blocks.get(idx)
  if (el)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => {
  nextTick(() => {
    checkActiveBlocks()
  })
})
</script>

<template>
  <div class="h-screen w-screen of-hidden flex">
    <nav class="h-full flex flex-col border-r border-main p2">
      <div class="of-auto flex flex-col flex-auto items-center">
        <button
          v-for="(route, idx) of rawRoutes"
          :key="route.path"
          class="relative transition duration-300 w-8 h-8 rounded hover:bg-gray:10 hover:op100"
          :class="[
            activeBlocks.includes(idx) ? 'op100 text-primary' : 'op20',
          ]"
          @click="scrollToSlide(idx)"
        >
          <div>{{ idx + 1 }}</div>
        </button>
      </div>
      <IconButton
        v-if="!isColorSchemaConfigured"
        :title="isDark ? 'Switch to light mode theme' : 'Switch to dark mode theme'"
        @click="toggleDark()"
      >
        <carbon-moon v-if="isDark" />
        <carbon-sun v-else />
      </IconButton>
    </nav>
    <main
      class="flex-1 h-full of-auto"
      :style="`grid-template-columns: repeat(auto-fit,minmax(${cardWidth}px,1fr))`"
      @scroll="checkActiveBlocks"
    >
      <div class="px4 py2 text-orange bg-orange:5">
        <span font-bold>List Overview</span> is in beta, feedback is welcome!
      </div>
      <div
        v-for="(route, idx) of rawRoutes"
        :key="route.path"
        :ref="el => blocks.set(idx, el)"
        class="relative border-t border-main of-hidden flex gap-4 min-h-50"
      >
        <div class="select-none text-3xl op25 my4 w-13 text-right">
          {{ idx + 1 }}
        </div>
        <div
          class="border rounded border-main overflow-hidden bg-main my5"
          :style="themeVars"
          @dblclick="openSlideInNewTab(route.path)"
        >
          <SlideContainer
            :key="route.path"
            :width="cardWidth"
            :clicks-disabled="true"
            class="pointer-events-none"
          >
            <SlideWrapper
              :is="route.component"
              v-if="route?.component"
              :clicks-context="useFixedClicks(route, 99999)[1]"
              :class="getSlideClass(route)"
              :route="route"
              render-context="overview"
            />
            <DrawingPreview :page="+route.path" />
          </SlideContainer>
        </div>
        <NoteDisplay
          :note="route.meta?.slide?.note"
          :note-html="route.meta?.slide?.noteHTML"
        />
      </div>
    </main>
  </div>
</template>
