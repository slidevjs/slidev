<script setup lang="ts">
import type { ClicksContext, SlideRoute } from '@slidev/types'
import { useHead } from '@unhead/vue'
import { computed, nextTick, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createFixedClicks } from '../composables/useClicks'
import { useNav } from '../composables/useNav'
import { CLICKS_MAX } from '../constants'
import { pathPrefix, slidesTitle } from '../env'
import ClicksSlider from '../internals/ClicksSlider.vue'
import DrawingPreview from '../internals/DrawingPreview.vue'
import IconButton from '../internals/IconButton.vue'
import NoteEditable from '../internals/NoteEditable.vue'
import SlideContainer from '../internals/SlideContainer.vue'
import SlideWrapper from '../internals/SlideWrapper.vue'
import { isColorSchemaConfigured, isDark, toggleDark } from '../logic/dark'
import { getSlidePath } from '../logic/slides'

const cardWidth = 450

useHead({ title: `Overview - ${slidesTitle}` })

const { openInEditor, slides } = useNav()
const route = useRoute()
const router = useRouter()

const blocks: Map<number, HTMLElement> = reactive(new Map())
const activeBlocks = ref<number[]>([])
const edittingNote = ref<number | null>(null)
const skipHashScroll = ref<string>()
const wordCounts = computed(() => slides.value.map(route => wordCount(route.meta?.slide?.note || '')))
const totalWords = computed(() => wordCounts.value.reduce((a, b) => a + b, 0))
const totalClicks = computed(() => slides.value.map(route => getSlideClicks(route)).reduce((a, b) => a + b, 0))

const activeSlide = shallowRef<SlideRoute>()
const clicksContextMap = new WeakMap<SlideRoute, ClicksContext>()
function getClicksContext(route: SlideRoute) {
  // We create a local clicks context to calculate the total clicks of the slide
  if (!clicksContextMap.has(route))
    clicksContextMap.set(route, createFixedClicks(route, CLICKS_MAX))
  return clicksContextMap.get(route)!
}

function getSlideClicks(route: SlideRoute) {
  return route.meta?.clicks || getClicksContext(route)?.total
}

function toggleRoute(route: SlideRoute) {
  if (activeSlide.value === route)
    activeSlide.value = undefined
  else
    activeSlide.value = route
}

function wordCount(str: string) {
  const pattern = /[\w`'\-\u0392-\u03C9\u00C0-\u00FF\u0600-\u06FF\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]+/g
  const m = str.match(pattern)
  let count = 0
  if (!m)
    return 0
  for (let i = 0; i < m.length; i++) {
    if (m[i].charCodeAt(0) >= 0x4E00) {
      count += m[i].length
    }
    else {
      count += 1
    }
  }
  return count
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
  a.href = pathPrefix + path.slice(1)
  a.click()
}

function getSlideHashId(no: number) {
  return `slide-${no}`
}

function getSlideHash(no: number) {
  return `#${getSlideHashId(no)}`
}

function getSlideIndexFromHash(hash: string) {
  const match = hash.match(/^#(?:slide-)?(\d+)$/)
  if (!match)
    return

  const no = Number.parseInt(match[1], 10)
  const idx = slides.value.findIndex(route => route.no === no)
  return idx >= 0 ? idx : undefined
}

function scrollToSlide(idx: number, behavior: ScrollBehavior = 'smooth') {
  const el = blocks.get(idx)
  if (el) {
    el.scrollIntoView({ behavior, block: 'start' })
    checkActiveBlocks()
  }
}

async function scrollToSlideAndUpdateHash(idx: number) {
  const target = slides.value[idx]
  if (!target)
    return

  const hash = getSlideHash(target.no)
  if (route.hash !== hash) {
    skipHashScroll.value = hash // Used to bypass the scroll triggered by hash change
    await router.replace({
      path: route.path,
      query: route.query,
      hash,
    })
  }

  scrollToSlide(idx)
}

function scrollToRouteHash(behavior: ScrollBehavior = 'auto') {
  const idx = getSlideIndexFromHash(route.hash)
  if (idx != null)
    scrollToSlide(idx, behavior)
}

function onMarkerClick(e: MouseEvent, clicks: number, route: SlideRoute) {
  const ctx = getClicksContext(route)
  if (ctx.current === clicks)
    ctx.current = CLICKS_MAX
  else
    ctx.current = clicks
  e.preventDefault()
}

// Handle browser back/forward and hash change
watch(
  () => route.hash,
  async (hash) => {
    if (!hash)
      return

    await nextTick()

    if (skipHashScroll.value === hash) {
      skipHashScroll.value = undefined
      return
    }

    scrollToRouteHash('smooth')
  },
)

onMounted(() => {
  nextTick(() => {
    scrollToRouteHash()
    checkActiveBlocks()
  })
})
</script>

<template>
  <div class="h-screen w-screen of-hidden flex">
    <nav class="grid grid-rows-[auto_max-content] border-r border-main select-none max-h-full h-full">
      <div class="relative">
        <div class="absolute left-0 top-0 bottom-0 w-200 flex flex-col flex-auto items-end group p2 gap-1 max-h-full of-x-visible of-y-auto" style="direction:rtl">
          <div
            v-for="(slide, idx) of slides"
            :key="slide.no"
            class="relative"
            style="direction:ltr"
          >
            <button
              class="relative transition duration-300 w-8 h-8 rounded hover:bg-active hover:op100"
              :class="activeBlocks.includes(idx) ? 'op100 text-primary bg-gray:5' : 'op20'"
              @click="scrollToSlideAndUpdateHash(idx)"
            >
              <div>{{ idx + 1 }}</div>
            </button>
            <div
              v-if="slide.meta?.slide?.title"
              class="pointer-events-none select-none absolute left-110% top-50% translate-y--50% ws-nowrap z-label px2 slidev-glass-effect transition duration-400 op0 group-hover:op100"
              :class="activeBlocks.includes(idx) ? 'text-primary' : 'text-main important-text-op-50'"
            >
              {{ slide.meta?.slide?.title }}
            </div>
          </div>
        </div>
      </div>
      <div p2 border="t main">
        <IconButton
          v-if="!isColorSchemaConfigured"
          :title="isDark ? 'Switch to light mode theme' : 'Switch to dark mode theme'"
          @click="toggleDark()"
        >
          <carbon-moon v-if="isDark" />
          <carbon-sun v-else />
        </IconButton>
        <IconButton
          v-else
          :title="isDark ? 'Dark mode' : 'Light mode'"
          pointer-events-none op50
        >
          <carbon-moon v-if="isDark" />
          <carbon-sun v-else />
        </IconButton>
      </div>
    </nav>
    <main
      class="flex-1 h-full of-auto"
      :style="`grid-template-columns: repeat(auto-fit,minmax(${cardWidth}px,1fr))`"
      @scroll="checkActiveBlocks"
    >
      <div
        v-for="(slide, idx) of slides"
        :id="getSlideHashId(slide.no)"
        :key="slide.no"
        :ref="el => blocks.set(idx, el as any)"
        class="relative border-t border-main of-hidden flex gap-4 min-h-50 group"
        :class="idx === 0 ? 'pt5' : ''"
      >
        <div class="select-none w-13 text-right my4 flex flex-col gap-1 items-end">
          <div class="text-3xl op20 mb2">
            {{ idx + 1 }}
          </div>
          <IconButton
            class="mr--3 op0 group-hover:op80"
            title="Play in new tab"
            @click="openSlideInNewTab(getSlidePath(slide, false))"
          >
            <div class="i-carbon:presentation-file" />
          </IconButton>
          <IconButton
            v-if="__DEV__ && slide.meta?.slide"
            class="mr--3 op0 group-hover:op80"
            title="Open in editor"
            @click="openInEditor(`${slide.meta.slide.filepath}:${slide.meta.slide.start}`)"
          >
            <div class="i-carbon:cics-program" />
          </IconButton>
        </div>
        <div class="flex flex-col gap-2 my5" :style="{ width: `${cardWidth}px` }">
          <div
            class="border rounded border-main overflow-hidden bg-main select-none h-max"
            @dblclick="openSlideInNewTab(getSlidePath(slide, false))"
          >
            <SlideContainer
              :key="slide.no"
              :width="cardWidth"
              class="pointer-events-none important:[&_*]:select-none"
            >
              <SlideWrapper
                :clicks-context="getClicksContext(slide)"
                :route="slide"
                render-context="overview"
              />
              <DrawingPreview :page="slide.no" />
            </SlideContainer>
          </div>
          <ClicksSlider
            v-if="getSlideClicks(slide)"
            :active="activeSlide === slide"
            :clicks-context="getClicksContext(slide)"
            class="w-full mt-2"
            @dblclick="toggleRoute(slide)"
            @click="activeSlide = slide"
          />
        </div>
        <div class="py3 mt-0.5 mr--8 ml--4 op0 transition group-hover:op100">
          <IconButton
            title="Edit Note"
            class="rounded-full w-9 h-9 text-sm"
            :class="edittingNote === slide.no ? 'important:op0' : ''"
            @click="edittingNote = slide.no"
          >
            <div class="i-carbon:pen" />
          </IconButton>
        </div>
        <NoteEditable
          :no="slide.no"
          class="max-w-250 w-250 text-lg rounded p3"
          :auto-height="true"
          :highlight="activeSlide === slide"
          :editing="edittingNote === slide.no"
          :clicks-context="getClicksContext(slide)"
          @dblclick="edittingNote !== slide.no ? edittingNote = slide.no : null"
          @update:editing="edittingNote = null"
          @marker-click="(e, clicks) => onMarkerClick(e, clicks, slide)"
        />
        <div
          v-if="wordCounts[idx] > 0"
          class="select-none absolute bottom-0 right-0 bg-main rounded-tl p2 op35 text-xs"
        >
          {{ wordCounts[idx] }} words
        </div>
      </div>
    </main>
    <div class="absolute top-0 right-0 px3 py1.5 border-b border-l rounded-lb bg-main border-main select-none">
      <div class="text-xs op50">
        {{ slides.length }} slides ·
        {{ totalClicks + slides.length - 1 }} clicks ·
        {{ totalWords }} words
      </div>
    </div>
  </div>
</template>
