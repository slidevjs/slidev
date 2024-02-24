<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useHead } from '@unhead/vue'
import type { RouteRecordRaw } from 'vue-router'
import type { ClicksContext } from 'packages/types'
import { themeVars } from '../env'
import { rawRoutes } from '../logic/nav'
import { useClicksContextBase } from '../composables/useClicks'
import { isColorSchemaConfigured, isDark, toggleDark } from '../logic/dark'
import { getSlideClass } from '../utils'
import SlideContainer from '../internals/SlideContainer.vue'
import SlideWrapper from '../internals/SlideWrapper'
import DrawingPreview from '../internals/DrawingPreview.vue'
import IconButton from '../internals/IconButton.vue'
import NoteEditor from '../internals/NoteEditor.vue'

const cardWidth = 450

useHead({
  title: 'List Overview',
})

const blocks: Map<number, HTMLElement> = reactive(new Map())
const activeBlocks = ref<number[]>([])
const edittingNote = ref<number | null>(null)
const wordCounts = computed(() => rawRoutes.map(route => wordCount(route.meta?.slide?.note || '')))
const totalWords = computed(() => wordCounts.value.reduce((a, b) => a + b, 0))
const totalClicks = computed(() => rawRoutes.map(route => getSlideClicks(route)).reduce((a, b) => a + b, 0))

const clicksContextMap = new WeakMap<RouteRecordRaw, ClicksContext>()
function getClickContext(route: RouteRecordRaw) {
  // We create a local clicks context to calculate the total clicks of the slide
  if (!clicksContextMap.has(route))
    clicksContextMap.set(route, useClicksContextBase(() => 999999, route?.meta?.clicks))
  return clicksContextMap.get(route)!
}

function getSlideClicks(route: RouteRecordRaw) {
  return route.meta?.clicks || getClickContext(route)?.total
}

function wordCount(str: string) {
  return str.match(/[\w\d\’\'-]+/gi)?.length || 0
}

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
    <nav class="h-full flex flex-col border-r border-main p2 select-none">
      <div class="flex flex-col flex-auto items-center justify-center group gap-1">
        <div
          v-for="(route, idx) of rawRoutes"
          :key="route.path"
          class="relative"
        >
          <button
            class="relative transition duration-300 w-8 h-8 rounded hover:bg-active hover:op100"
            :class="activeBlocks.includes(idx) ? 'op100 text-primary bg-gray:5' : 'op20'"
            @click="scrollToSlide(idx)"
          >
            <div>{{ idx + 1 }}</div>
          </button>
          <div
            v-if="route.meta?.slide?.title"
            class="pointer-events-none select-none absolute left-110% bg-main top-50% translate-y--50% ws-nowrap z-10 px2 shadow-xl rounded border border-main transition duration-400 op0 group-hover:op100"
            :class="activeBlocks.includes(idx) ? 'text-primary' : 'text-main important-text-op-50'"
          >
            {{ route.meta?.slide?.title }}
          </div>
        </div>
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
      <div
        v-for="(route, idx) of rawRoutes"
        :key="route.path"
        :ref="el => blocks.set(idx, el as any)"
        class="relative border-t border-main of-hidden flex gap-4 min-h-50 group"
      >
        <div class="select-none w-13 text-right my4">
          <div class="text-3xl op20 mb2">
            {{ idx + 1 }}
          </div>
          <div
            v-if="getSlideClicks(route)"
            class="flex gap-0.5 op50 items-center justify-end"
            :title="`Clicks in this slide: ${getSlideClicks(route)}`"
          >
            <carbon:cursor-1 text-sm />
            {{ getSlideClicks(route) }}
          </div>
        </div>
        <div
          class="border rounded border-main overflow-hidden bg-main my5 select-none h-max"
          :style="themeVars"
          @dblclick="openSlideInNewTab(route.path)"
        >
          <SlideContainer
            :key="route.path"
            :width="cardWidth"
            :clicks-disabled="true"
            class="pointer-events-none important:[&_*]:select-none"
          >
            <SlideWrapper
              :is="route.component"
              v-if="route?.component"
              :clicks-context="getClickContext(route)"
              :class="getSlideClass(route)"
              :route="route"
              render-context="overview"
            />
            <DrawingPreview :page="+route.path" />
          </SlideContainer>
        </div>
        <div class="py3 mt-0.5 mr--8 ml--4 op0 transition group-hover:op100">
          <IconButton
            title="Edit Note"
            class="rounded-full w-9 h-9 text-sm"
            :class="edittingNote === idx ? 'important:op0' : ''"
            @click="edittingNote = idx"
          >
            <carbon:pen />
          </IconButton>
        </div>
        <NoteEditor
          :no="idx"
          class="max-w-250 w-250 text-lg rounded p3"
          :auto-height="true"
          :editing="edittingNote === idx"
          @dblclick="edittingNote !== idx ? edittingNote = idx : null"
          @update:editing="edittingNote = null"
        />
        <div
          v-if="wordCounts[idx] > 0"
          class="absolute bottom-0 right-0 bg-main rounded-tl p2 op35 text-xs"
        >
          {{ wordCounts[idx] }} words
        </div>
      </div>
    </main>
    <div class="absolute top-0 right-0 px3 py1.5 border-b border-l rounded-lb bg-main border-main">
      <div class="text-xs op50">
        {{ rawRoutes.length }} slides ·
        {{ totalClicks + rawRoutes.length - 1 }} clicks ·
        {{ totalWords }} words
      </div>
    </div>
  </div>
</template>
