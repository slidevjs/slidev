<script setup lang="ts">
import type { SlideRoute } from '@slidev/types'
import HandoutBottom from '#slidev/global-components/handout-bottom'
import { computed } from 'vue'
import { slideHeight, slideWidth } from '../env'
import NoteDisplay from './NoteDisplay.vue'
import PrintSlide from './PrintSlide.vue'

const props = defineProps<{
  route: SlideRoute
  index: number
  pageOffset?: number
}>()
const route = computed(() => props.route)
const pageOffset = computed(() => props.pageOffset ?? 0)

// Use fixed A4 dimensions in CSS pixels (96 DPI) to avoid relying on
// runtime viewport sizes which can skew scaling during headless export
const PAGE_WIDTH_PX = Math.round(210 / 25.4 * 96)
const PAGE_HEIGHT_PX = Math.round(297 / 25.4 * 96)
const pageWidth = computed(() => PAGE_WIDTH_PX)
const pageHeight = computed(() => PAGE_HEIGHT_PX)

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
</script>

<template>
  <div class="break-after-page page">
    <div class="slide-area" :style="slideAreaStyle">
      <div class="slide-scale-wrap" :style="{ width: `${slideWidth}px`, height: `${slideHeight}px`, transform: `scale(${scale})` }">
        <PrintSlide :route="route" />
      </div>
    </div>
    <div class="notes-area">
      <NoteDisplay
        v-if="route.meta?.slide!.noteHTML"
        :note-html="route.meta?.slide!.noteHTML"
        class="w-full mx-auto px-4 handout-notes"
      />
    </div>
    <div class="footer-area">
      <div class="footer-bleed">
        <HandoutBottom :page-number="index + 1 + pageOffset" :page-offset="pageOffset" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* One handout page per printed page, sized to A4 with internal padding */
.page {
  display: flex;
  flex-direction: column;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 10mm 12mm 4mm; /* top, sides, bottom */

  box-sizing: border-box;
  break-after: page;
  page-break-after: always; /* Chromium fallback */
  break-inside: avoid-page;
}
.slide-area {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
.slide-area {
  /* Allow slide borders/shadows to render fully */
  overflow: visible;
  margin-bottom: 4mm;
}
.slide-scale-wrap {
  transform-origin: top center;
  margin: 0 auto;
}
.slide-scale-wrap :deep(.print-slide-container) {
  break-after: auto;
  /* Thin dark gray border around each slide in handout */
  border: 1px solid rgba(0, 0, 0, 0.6);
  border-radius: 2px;
}
.notes-area {
  flex: 1 1 auto;
  overflow: hidden;
  display: flex;
  /* add a bit more top spacing above notes */
  padding: 8mm 3mm 12mm;
}
.handout-notes {
  margin: 0 auto;
  max-width: none;
}
.footer-area {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 6mm;
  flex: 0 0 auto;
  min-height: 14mm;
}
/* full-width top rule across footer */
.footer-area::before {
  content: '';
  position: absolute;
  left: -12mm;
  right: -12mm;
  top: 0;
  height: 1px;
  background: #222;
  opacity: 0.9;
}
.footer-bleed {
  flex: 1 1 auto;
  position: relative;
  margin: 0;
  overflow: visible;
  padding-top: 2mm;
}
.footer-bleed :deep(*) {
  max-width: 100% !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  border-top-width: 0 !important;
}
.page-num {
  flex: 0 0 auto;
  font-size: 11px;
  text-align: right;
  padding-bottom: 1mm;
  z-index: 1;
}
</style>
