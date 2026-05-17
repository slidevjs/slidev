<script setup lang="ts">
import type { ClicksContext, SlideRoute } from '@slidev/types'
import { useHead } from '@unhead/vue'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createFixedClicks } from '../composables/useClicks'
import { useNav } from '../composables/useNav'
import { CLICKS_MAX } from '../constants'
import { pathPrefix, slideAspect, slidesTitle } from '../env'
import ClicksSlider from '../internals/ClicksSlider.vue'
import DrawingPreview from '../internals/DrawingPreview.vue'
import IconButton from '../internals/IconButton.vue'
import NoteEditable from '../internals/NoteEditable.vue'
import SlideContainer from '../internals/SlideContainer.vue'
import SlideWrapper from '../internals/SlideWrapper.vue'
import { isColorSchemaConfigured, isDark, toggleDark } from '../logic/dark'
import { getSlidePath } from '../logic/slides'
import { windowSize } from '../state'

const cardWidth = 450

useHead({ title: `Overview - ${slidesTitle}` })

const currentRoute = useRoute()
const router = useRouter()
const { openInEditor, slides, isEmbedded } = useNav()
const isPreviewMode = computed(() => currentRoute.query.mode === 'preview')
const isEmbeddedPreviewMode = computed(() => isPreviewMode.value && isEmbedded.value)
const overviewCardWidth = computed(() => {
  if (!isPreviewMode.value)
    return cardWidth
  if (isEmbeddedPreviewMode.value)
    return Math.max(0, windowSize.width.value - 16)
  return Math.min(900, Math.max(320, windowSize.width.value - 160))
})
const overviewSlideHeight = computed(() => overviewCardWidth.value / slideAspect.value)

const blocks: Map<number, HTMLElement> = reactive(new Map())
const slidePreviews: Map<number, HTMLElement> = reactive(new Map())
const activeBlocks = ref<number[]>([])
const scroller = ref<HTMLElement>()
const edittingNote = ref<number | null>(null)
let ignoreOverviewScrollUntil = 0
let pendingOverviewScrollNo: number | undefined
let overviewScrollTimer: ReturnType<typeof setTimeout> | undefined
const wordCounts = computed(() => slides.value.map(route => wordCount(route.meta?.slide?.note || '')))
const totalWords = computed(() => wordCounts.value.reduce((a, b) => a + b, 0))
const totalClicks = computed(() => slides.value.map(route => getSlideClicks(route)).reduce((a, b) => a + b, 0))
const slideNoDigits = computed(() => String(Math.max(1, slides.value.length)).length)

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

function checkActiveBlocks() {
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight
  let active: { idx: number, visibleHeight: number } | undefined
  const fullyVisible: number[] = []

  for (const [idx, el] of blocks.entries()) {
    const rect = el.getBoundingClientRect()
    const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0))
    if (visibleHeight === 0)
      continue
    if (visibleHeight >= rect.height)
      fullyVisible.push(idx)
    if (!active || visibleHeight > active.visibleHeight)
      active = { idx, visibleHeight }
  }

  activeBlocks.value = fullyVisible.length ? fullyVisible : active ? [active.idx] : []
}

function openSlideInNewTab(path: string) {
  const a = document.createElement('a')
  a.target = '_blank'
  a.href = pathPrefix + path.slice(1)
  a.click()
}

function openSlideInBrowser(path: string) {
  const url = new URL(pathPrefix + path.slice(1), location.href).href
  if (isEmbedded.value) {
    window.parent.postMessage({
      target: 'slidev',
      sender: 'slidev',
      type: 'open-external',
      url,
    }, '*')
    return
  }
  openSlideInNewTab(path)
}

function scrollToSlide(idx: number) {
  const el = blocks.get(idx)
  if (el)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function getSlidePreviewTop(idx: number) {
  const el = slidePreviews.get(idx) || blocks.get(idx)
  if (!el || !scroller.value)
    return null
  const scrollerRect = scroller.value.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  return elRect.top - scrollerRect.top + scroller.value.scrollTop
}

function scrollSlideNoIntoCenter(no: number) {
  if (!scroller.value || slides.value.length === 0)
    return
  const clamped = Math.min(Math.max(no, 1), slides.value.length)
  const idx = Math.floor(clamped) - 1
  const progress = clamped - (idx + 1)
  const start = getSlidePreviewTop(idx)
  const end = getSlidePreviewTop(idx + 1)
  if (start == null)
    return
  const top = start
    + (end == null ? 0 : (end - start) * progress)
    - scroller.value.clientHeight * 0.5
  if (Math.abs(scroller.value.scrollTop - top) < 1)
    return
  scroller.value.scrollTo({ top })
}

function getInitialSlideNo() {
  const value = currentRoute.query.slideNo
  const no = Number(Array.isArray(value) ? value[0] : value)
  return Number.isFinite(no) && no > 0 ? no : undefined
}

function updateSlideNoQuery(no: number) {
  if (!isEmbeddedPreviewMode.value)
    return
  const slideNo = Number(no.toFixed(3)).toString()
  if (currentRoute.query.slideNo === slideNo)
    return
  router.replace({
    query: {
      ...currentRoute.query,
      slideNo,
    },
  })
}

function getCenteredSlideNo() {
  if (!scroller.value || slides.value.length === 0)
    return null
  const center = scroller.value.scrollTop + scroller.value.clientHeight * 0.5
  const tops = slides.value
    .map((_, idx) => getSlidePreviewTop(idx))
    .filter((top): top is number => top != null)
  if (tops.length === 0)
    return null
  if (tops.length === 1 || center <= tops[0])
    return 1
  for (let i = 1; i < tops.length; i++) {
    if (center <= tops[i]) {
      const span = Math.max(1, tops[i] - tops[i - 1])
      return i + (center - tops[i - 1]) / span
    }
  }
  return slides.value.length
}

function postOverviewScroll(no: number) {
  pendingOverviewScrollNo = no
  if (overviewScrollTimer)
    return
  overviewScrollTimer = setTimeout(() => {
    overviewScrollTimer = undefined
    const no = pendingOverviewScrollNo
    pendingOverviewScrollNo = undefined
    if (no == null)
      return
    updateSlideNoQuery(no)
    if (Date.now() < ignoreOverviewScrollUntil)
      return
    window.parent.postMessage({
      target: 'slidev',
      sender: 'slidev',
      type: 'overview-scroll',
      no,
    }, '*')
  }, 50)
}

function onOverviewScroll() {
  checkActiveBlocks()
  if (!isEmbeddedPreviewMode.value || Date.now() < ignoreOverviewScrollUntil)
    return
  const no = getCenteredSlideNo()
  if (no != null)
    postOverviewScroll(no)
}

function onOverviewMessage({ data }: MessageEvent) {
  if (
    !isEmbeddedPreviewMode.value
    || data?.target !== 'slidev'
    || data.sender !== 'vscode'
    || data.type !== 'overview-scroll'
  ) {
    return
  }
  const no = Number(data.no)
  if (no > 0) {
    ignoreOverviewScrollUntil = Date.now() + 300
    pendingOverviewScrollNo = undefined
    updateSlideNoQuery(no)
    scrollSlideNoIntoCenter(no)
  }
}

function onMarkerClick(e: MouseEvent, clicks: number, route: SlideRoute) {
  const ctx = getClicksContext(route)
  if (ctx.current === clicks)
    ctx.current = CLICKS_MAX
  else
    ctx.current = clicks
  e.preventDefault()
}

function openOverviewSlideSource(e: MouseEvent, route: SlideRoute) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    openSlideInBrowser(getSlidePath(route, false))
    return
  }
  const slide = route.meta?.slide
  if (!slide)
    return
  window.parent.postMessage({
    target: 'slidev',
    type: 'command',
    command: 'goto',
    args: [slide.filepath, slide.sourceIndex],
  }, '*')
}

onMounted(() => {
  window.addEventListener('message', onOverviewMessage)
  const initialSlideNo = isEmbeddedPreviewMode.value ? getInitialSlideNo() : undefined
  if (initialSlideNo != null) {
    ignoreOverviewScrollUntil = Date.now() + 300
    scrollSlideNoIntoCenter(initialSlideNo)
  }
  nextTick(() => {
    if (initialSlideNo != null)
      scrollSlideNoIntoCenter(initialSlideNo)
    checkActiveBlocks()
  })
})

onUnmounted(() => {
  window.removeEventListener('message', onOverviewMessage)
  if (overviewScrollTimer)
    clearTimeout(overviewScrollTimer)
})
</script>

<template>
  <div class="h-screen w-screen of-hidden flex">
    <nav
      v-if="!isEmbedded"
      class="grid grid-rows-[auto_max-content] border-r border-main select-none max-h-full h-full"
    >
      <div class="relative">
        <div class="absolute left-0 top-0 bottom-0 w-200 flex flex-col flex-auto items-end group p-6px md:p-10px gap-1 max-h-full of-x-visible of-y-auto" style="direction:rtl">
          <div
            v-for="(route, idx) of slides"
            :key="route.no"
            class="relative"
            style="direction:ltr"
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
              class="pointer-events-none select-none absolute left-110% top-50% translate-y--50% ws-nowrap z-label px2 slidev-glass-effect transition duration-400 op0 group-hover:op100"
              :class="activeBlocks.includes(idx) ? 'text-primary' : 'text-main important-text-op-50'"
            >
              {{ route.meta?.slide?.title }}
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
      ref="scroller"
      class="flex-1 h-full of-auto"
      :style="`grid-template-columns: repeat(auto-fit,minmax(${cardWidth}px,1fr))`"
      @scroll="onOverviewScroll"
    >
      <div
        v-for="(route, idx) of slides"
        :key="route.no"
        :ref="el => blocks.set(idx, el as any)"
        class="overview-slide-block relative of-hidden flex gap-4 min-h-50"
        :class="[idx === 0 && !isEmbeddedPreviewMode ? 'pt2' : '', isEmbeddedPreviewMode ? 'justify-center' : 'border-t border-main']"
      >
        <div
          v-if="!isEmbeddedPreviewMode"
          class="select-none text-right my5 flex flex-col justify-between items-end"
          :class="isPreviewMode ? 'w-9' : 'w-13'"
          :style="{ height: `${overviewSlideHeight}px` }"
        >
          <div class="self-center text-3xl op20 mb2 text-center mr--14px tabular-nums" :style="{ width: `${slideNoDigits}ch` }">
            {{ idx + 1 }}
          </div>
          <div class="flex flex-col gap-1 mx-1 items-end">
            <IconButton
              class="overview-slide-action mr--4 op0"
              :class="isPreviewMode ? 'text-lg' : ''"
              title="Play in new tab"
              @click="openSlideInNewTab(getSlidePath(route, false))"
            >
              <div class="i-carbon:presentation-file" />
            </IconButton>
            <IconButton
              v-if="__DEV__ && route.meta?.slide"
              class="overview-slide-action mr--4 op0"
              :class="isPreviewMode ? 'text-lg' : ''"
              title="Open in editor"
              @click="openInEditor(`${route.meta.slide.filepath}:${route.meta.slide.start}`)"
            >
              <div class="i-carbon:edit" />
            </IconButton>
          </div>
        </div>
        <div
          class="flex flex-col"
          :class="isEmbeddedPreviewMode ? 'my1 gap-0' : 'my5 gap-2'"
          :style="{ width: `${overviewCardWidth}px` }"
        >
          <div
            v-if="isEmbeddedPreviewMode"
            class="flex items-end gap-2"
          >
            <button
              type="button"
              class="select-none pl-1 text-lg leading-tight op60 tabular-nums hover:op90 hover:underline underline-offset-2"
              @click="openOverviewSlideSource($event, route)"
            >
              {{ idx + 1 }}
            </button>
            <ClicksSlider
              v-if="getSlideClicks(route)"
              :active="activeSlide === route"
              :clicks-context="getClicksContext(route)"
              resettable
              compact
              attached
              class="ml-auto w-88 min-w-[70%] max-w-[calc(100%-3rem)]"
              @dblclick="toggleRoute(route)"
              @activate="activeSlide = route"
              @reset="activeSlide = undefined"
            />
          </div>
          <div
            :ref="el => slidePreviews.set(idx, el as any)"
            class="border rounded border-main overflow-hidden bg-main h-max"
            :class="[isEmbeddedPreviewMode && getSlideClicks(route) ? 'rounded-tr-0' : '', isEmbeddedPreviewMode ? '' : 'select-none']"
            @dblclick="!isEmbeddedPreviewMode && openSlideInNewTab(getSlidePath(route, false))"
          >
            <SlideContainer
              :key="route.no"
              :width="overviewCardWidth"
              :class="isEmbeddedPreviewMode ? '' : 'pointer-events-none important:[&_*]:select-none'"
            >
              <SlideWrapper
                :clicks-context="getClicksContext(route)"
                :route="route"
                render-context="overview"
              />
              <DrawingPreview :page="route.no" />
            </SlideContainer>
          </div>
          <ClicksSlider
            v-if="getSlideClicks(route) && !isEmbeddedPreviewMode"
            :active="activeSlide === route"
            :clicks-context="getClicksContext(route)"
            resettable
            class="ml-1 w-[calc(100%-0.25rem)]"
            :class="isPreviewMode ? '' : 'mt-2'"
            @dblclick="toggleRoute(route)"
            @activate="activeSlide = route"
            @reset="activeSlide = undefined"
          />
        </div>
        <NoteEditable
          v-if="!isPreviewMode"
          :no="route.no"
          class="relative z-1 max-w-250 w-250 text-lg rounded p3"
          :auto-height="true"
          :highlight="activeSlide === route"
          :editing="edittingNote === route.no"
          :clicks-context="getClicksContext(route)"
          @dblclick="edittingNote !== route.no ? edittingNote = route.no : null"
          @update:editing="edittingNote = null"
          @marker-click="(e, clicks) => onMarkerClick(e, clicks, route)"
        />
        <div
          v-if="!isPreviewMode && wordCounts[idx] > 0"
          class="select-none absolute bottom-0 right-0 bg-main rounded-tl p2 op35 text-xs"
        >
          {{ wordCounts[idx] }} words
        </div>
      </div>
    </main>
    <div
      v-if="!isEmbedded"
      class="absolute z-2 top-0 right-0 px3 py1.5 border-b border-l rounded-lb bg-main/80 backdrop-blur border-main select-none"
    >
      <div class="text-xs op50">
        {{ slides.length }} slides ·
        {{ totalClicks + slides.length - 1 }} clicks ·
        {{ totalWords }} words
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-slide-block:hover .overview-slide-action {
  opacity: 0.6;
}

.overview-slide-action:hover {
  opacity: 0.8;
}
</style>
