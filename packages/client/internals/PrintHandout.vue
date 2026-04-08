<script setup lang="ts">
import type { SlideRoute } from '@slidev/types'
import HandoutBottom from '#slidev/global-components/handout-bottom'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { configs, slideHeight, slideWidth } from '../env'
import NoteDisplay from './NoteDisplay.vue'
import PrintSlide from './PrintSlide.vue'

const props = defineProps<{
  route: SlideRoute
  index: number
  pageBase?: number
  pageOffset?: number
}>()

const emit = defineEmits<{
  (e: 'pageCountChange', count: number): void
}>()

const route = computed(() => props.route)
const pageBase = computed(() => props.pageBase ?? (props.index + 1 + (props.pageOffset ?? 0)))
const pageOffset = computed(() => props.pageOffset ?? 0)
const noteHtml = computed(() => route.value.meta?.slide?.noteHTML || '')

// Use configured dimensions (converted to CSS pixels at 96 DPI) to avoid relying on
// runtime viewport sizes which can skew scaling during headless export.
const handoutOptions = computed(() => configs.handout)
const paginateOverflow = computed(() => handoutOptions.value.paginateOverflow)
const pageWidth = computed(() => handoutOptions.value.widthPx)
const pageHeight = computed(() => handoutOptions.value.heightPx)

// Target layout: slide ~50% height, notes the rest, footer pinned.
const SLIDE_PORTION = 0.5
const PX_PER_MM = 96 / 25.4
const PAGE_PAD_SIDE_MM = 12
const PAGE_PAD_TOP_MM = 10
const PAGE_PAD_BOTTOM_MM = 10
const SLIDE_SIDE_MARGIN_MM = 6
const SLIDE_TOP_MARGIN_MM = 4

const scale = computed(() => {
  const innerWidth = pageWidth.value - 2 * PAGE_PAD_SIDE_MM * PX_PER_MM
  const innerHeight = pageHeight.value - (PAGE_PAD_TOP_MM + PAGE_PAD_BOTTOM_MM) * PX_PER_MM
  const byWidth = (innerWidth - 2 * SLIDE_SIDE_MARGIN_MM * PX_PER_MM) / slideWidth.value
  const byHeight = ((innerHeight * SLIDE_PORTION) - (SLIDE_TOP_MARGIN_MM * PX_PER_MM)) / slideHeight.value
  const s = Math.min(1, byWidth, byHeight)
  return Math.max(0, s - 0.006)
})

const slideHeightScaled = computed(() => slideHeight.value * scale.value)
const slideAreaStyle = computed(() => ({
  height: `${slideHeightScaled.value}px`,
  padding: `${SLIDE_TOP_MARGIN_MM}mm ${SLIDE_SIDE_MARGIN_MM}mm 0`,
}))
const pageBoxStyle = computed(() => ({
  width: `${handoutOptions.value.widthMm}mm`,
  ...(paginateOverflow.value
    ? { height: `${handoutOptions.value.heightMm}mm` }
    : { minHeight: `${handoutOptions.value.heightMm}mm` }),
}))

const paginationReady = ref(false)
const notePages = ref<string[]>([''])
const firstMeasureNotesArea = ref<HTMLElement | null>(null)
const continuationMeasureNotesArea = ref<HTMLElement | null>(null)
const firstMeasureNotes = ref<HTMLElement | null>(null)
const continuationMeasureNotes = ref<HTMLElement | null>(null)

function createListBlock(list: HTMLElement, item: Element, index: number) {
  const clone = list.cloneNode(false) as HTMLElement
  if (clone.tagName === 'OL') {
    const start = Number(list.getAttribute('start') || '1')
    clone.setAttribute('start', String(start + index))
  }
  clone.append(item.cloneNode(true))
  return clone.outerHTML
}

function createParagraphBlock(text: string) {
  const paragraph = document.createElement('p')
  paragraph.textContent = text
  return paragraph.outerHTML
}

function createBlocks(html: string) {
  const template = document.createElement('template')
  template.innerHTML = html

  const blocks: string[] = []
  Array.from(template.content.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text)
        blocks.push(createParagraphBlock(text))
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE)
      return

    const element = node as HTMLElement
    if ((element.tagName === 'UL' || element.tagName === 'OL') && Array.from(element.children).every(child => child.tagName === 'LI')) {
      Array.from(element.children).forEach((child, index) => {
        blocks.push(createListBlock(element, child, index))
      })
      return
    }

    blocks.push(element.outerHTML)
  })

  return blocks
}

function fitBlocks(blocks: string[], target: HTMLElement, maxHeight: number) {
  const current: string[] = []
  let consumed = 0

  for (const block of blocks) {
    current.push(block)
    target.innerHTML = current.join('')
    if (target.scrollHeight <= maxHeight + 1 || current.length === 1) {
      consumed += 1
      continue
    }

    current.pop()
    target.innerHTML = current.join('')
    break
  }

  if (!consumed && blocks.length) {
    consumed = 1
    target.innerHTML = blocks[0]
  }

  const html = target.innerHTML
  target.innerHTML = ''
  return {
    consumed,
    html,
  }
}

async function waitForPaginationLayout() {
  await nextTick()
  if (typeof document !== 'undefined' && 'fonts' in document)
    await document.fonts.ready.catch(() => {})
  await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)))
  await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)))
}

async function paginateNotes() {
  if (!paginateOverflow.value) {
    notePages.value = [noteHtml.value]
    paginationReady.value = true
    emit('pageCountChange', 1)
    return
  }

  paginationReady.value = false
  notePages.value = ['']

  if (!noteHtml.value) {
    paginationReady.value = true
    emit('pageCountChange', 1)
    return
  }

  await waitForPaginationLayout()

  const firstArea = firstMeasureNotesArea.value
  const continuationArea = continuationMeasureNotesArea.value
  const firstTarget = firstMeasureNotes.value
  const continuationTarget = continuationMeasureNotes.value
  if (!firstArea || !continuationArea || !firstTarget || !continuationTarget) {
    notePages.value = [noteHtml.value]
    paginationReady.value = true
    emit('pageCountChange', 1)
    return
  }

  const firstLimit = firstArea.clientHeight
  const continuationLimit = continuationArea.clientHeight

  if (!firstLimit || !continuationLimit) {
    notePages.value = [noteHtml.value]
    paginationReady.value = true
    emit('pageCountChange', 1)
    return
  }

  firstTarget.innerHTML = noteHtml.value
  if (firstTarget.scrollHeight <= firstLimit + 1) {
    firstTarget.innerHTML = ''
    notePages.value = [noteHtml.value]
    paginationReady.value = true
    emit('pageCountChange', 1)
    return
  }
  firstTarget.innerHTML = ''

  const blocks = createBlocks(noteHtml.value)

  if (blocks.length === 0) {
    notePages.value = [noteHtml.value]
    paginationReady.value = true
    emit('pageCountChange', 1)
    return
  }

  const pages: string[] = []
  let cursor = 0

  while (cursor < blocks.length) {
    const target = cursor === 0 ? firstTarget : continuationTarget
    const limit = cursor === 0 ? firstLimit : continuationLimit
    const { html, consumed } = fitBlocks(blocks.slice(cursor), target, limit)
    if (!consumed)
      break
    pages.push(html)
    cursor += consumed
  }

  notePages.value = pages.length ? pages : [noteHtml.value]
  paginationReady.value = true
  emit('pageCountChange', Math.max(1, notePages.value.length))
}

watch(
  () => [noteHtml.value, scale.value, paginateOverflow.value],
  () => {
    paginateNotes()
  },
)

watch(
  () => pageBase.value,
  () => {
    if (paginationReady.value)
      emit('pageCountChange', Math.max(1, notePages.value.length))
  },
)

onMounted(() => {
  paginateNotes()
})
</script>

<template>
  <div
    v-if="!paginateOverflow"
    class="break-after-page slidev-handout-page"
    :style="pageBoxStyle"
  >
    <div class="slidev-handout-slide-area" :style="slideAreaStyle">
      <div
        class="slidev-handout-slide-scale-wrap"
        :style="{ 'width': `${slideWidth}px`, 'height': `${slideHeight}px`, 'transform': `scale(${scale})`, '--slidev-slide-container-scale': scale.toString() }"
      >
        <PrintSlide :route="route" />
      </div>
    </div>
    <div class="slidev-handout-notes-area">
      <NoteDisplay
        v-if="route.meta?.slide!.noteHTML"
        :note-html="route.meta?.slide!.noteHTML"
        :invert="false"
        class="w-full slidev-handout-notes"
      />
    </div>
    <div class="slidev-handout-footer-area">
      <div class="slidev-handout-footer-bleed">
        <HandoutBottom :page-number="pageBase" :page-offset="pageOffset" />
      </div>
    </div>
  </div>

  <div
    v-else-if="!paginationReady"
    class="slidev-handout-pagination-status"
    data-handout-pagination-ready="false"
  />

  <template v-else-if="paginateOverflow">
    <div
      v-for="(pageNotes, pageIndex) of notePages"
      :key="`${route.no}-${pageIndex}`"
      class="break-after-page slidev-handout-page"
      :class="{
        'slidev-handout-page--continuation': paginateOverflow && pageIndex > 0,
        'slidev-handout-page--paginated': paginateOverflow,
      }"
      :style="pageBoxStyle"
      data-handout-page
      :data-handout-pagination-ready="paginateOverflow ? 'true' : null"
    >
      <div v-if="pageIndex === 0" class="slidev-handout-slide-area" :style="slideAreaStyle">
        <div
          class="slidev-handout-slide-scale-wrap"
          :style="{ 'width': `${slideWidth}px`, 'height': `${slideHeight}px`, 'transform': `scale(${scale})`, '--slidev-slide-container-scale': scale.toString() }"
        >
          <PrintSlide :route="route" />
        </div>
      </div>
      <div v-else class="slidev-handout-continuation-header">
        Notes Continued
      </div>
      <div
        class="slidev-handout-notes-area"
        :class="{ 'slidev-handout-notes-area--continuation': paginateOverflow && pageIndex > 0 }"
      >
        <NoteDisplay
          v-if="pageNotes"
          :note-html="pageNotes"
          :invert="false"
          class="w-full slidev-handout-notes"
        />
      </div>
      <div class="slidev-handout-footer-area">
        <div class="slidev-handout-footer-bleed">
          <HandoutBottom :page-number="pageBase + pageIndex" :page-offset="pageOffset" />
        </div>
      </div>
    </div>
  </template>

  <div v-if="paginateOverflow" class="slidev-handout-pagination-measure" aria-hidden="true">
    <div class="slidev-handout-page slidev-handout-page--measure" :style="pageBoxStyle">
      <div class="slidev-handout-slide-area" :style="slideAreaStyle" />
      <div ref="firstMeasureNotesArea" class="slidev-handout-notes-area">
        <div ref="firstMeasureNotes" class="prose outline-none slidev-note slidev-handout-notes slidev-handout-notes-measure" />
      </div>
      <div class="slidev-handout-footer-area">
        <div class="slidev-handout-footer-bleed">
          <HandoutBottom :page-number="pageBase" :page-offset="pageOffset" />
        </div>
      </div>
    </div>
    <div class="slidev-handout-page slidev-handout-page--continuation slidev-handout-page--measure" :style="pageBoxStyle">
      <div class="slidev-handout-continuation-header">
        Notes Continued
      </div>
      <div ref="continuationMeasureNotesArea" class="slidev-handout-notes-area slidev-handout-notes-area--continuation">
        <div ref="continuationMeasureNotes" class="prose outline-none slidev-note slidev-handout-notes slidev-handout-notes-measure" />
      </div>
      <div class="slidev-handout-footer-area">
        <div class="slidev-handout-footer-bleed">
          <HandoutBottom :page-number="pageBase + 1" :page-offset="pageOffset" />
        </div>
      </div>
    </div>
  </div>
</template>
