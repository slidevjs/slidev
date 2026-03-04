<script setup lang="ts">
import type { SlideRoute } from '@slidev/types'
import HandoutBottom from '#slidev/global-components/handout-bottom'
import { computed } from 'vue'
import { configs, slideHeight, slideWidth } from '../env'
import NoteDisplay from './NoteDisplay.vue'
import PrintSlide from './PrintSlide.vue'

const props = defineProps<{
  route: SlideRoute
  index: number
  pageOffset?: number
}>()
const route = computed(() => props.route)
const pageOffset = computed(() => props.pageOffset ?? 0)

// Use configured dimensions (converted to CSS pixels at 96 DPI) to avoid relying on
// runtime viewport sizes which can skew scaling during headless export
const handoutOptions = computed(() => configs.handout)
const pageWidth = computed(() => handoutOptions.value.widthPx)
const pageHeight = computed(() => handoutOptions.value.heightPx)

// Target layout: slide ~50% height, notes the rest, footer pinned
const SLIDE_PORTION = 0.5
const PX_PER_MM = 96 / 25.4
// Inner paddings of the page box
const PAGE_PAD_SIDE_MM = 12
const PAGE_PAD_TOP_MM = 10
const PAGE_PAD_BOTTOM_MM = 10
// Extra margins around the slide area
const SLIDE_SIDE_MARGIN_MM = 6
const SLIDE_TOP_MARGIN_MM = 4

// Constrain slide scale by width and by allowed height portion with top/side margins
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
  minHeight: `${handoutOptions.value.heightMm}mm`,
}))
</script>

<template>
  <div class="break-after-page slidev-handout-page" :style="pageBoxStyle">
    <div class="slidev-handout-slide-area" :style="slideAreaStyle">
      <div class="slidev-handout-slide-scale-wrap" :style="{ width: `${slideWidth}px`, height: `${slideHeight}px`, transform: `scale(${scale})` }">
        <PrintSlide :route="route" />
      </div>
    </div>
    <div class="slidev-handout-notes-area">
      <NoteDisplay
        v-if="route.meta?.slide!.noteHTML"
        :note-html="route.meta?.slide!.noteHTML"
        class="w-full mx-auto px-4 slidev-handout-notes"
      />
    </div>
    <div class="slidev-handout-footer-area">
      <div class="slidev-handout-footer-bleed">
        <HandoutBottom :page-number="index + 1 + pageOffset" :page-offset="pageOffset" />
      </div>
    </div>
  </div>
</template>
