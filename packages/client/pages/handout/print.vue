<script setup lang="ts">
import HandoutCover from '#slidev/global-components/handout-cover'
import { useElementSize } from '@vueuse/core'
import { computed, nextTick, onMounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useNav } from '../../composables/useNav'
import { themeVars } from '../../env'
import PrintContainerHandout from '../../internals/PrintContainerHandout.vue'
import { windowSize } from '../../state'

const { isPrintMode } = useNav()

const root = ref<HTMLElement | null>(null)
const { width: rootWidth } = useElementSize(root)
const route = useRoute()
const includeCover = computed(() => route.query.cover != null)
const coverRoot = ref<HTMLElement | null>(null)
const pageOffset = ref(0)

watchEffect(() => {
  const html = document.body.parentNode as HTMLElement
  if (isPrintMode.value)
    html.classList.add('print')
  else
    html.classList.remove('print')
})

function recountCoverPages() {
  if (!includeCover.value) {
    pageOffset.value = 0
    return
  }
  const el = coverRoot.value
  if (!el) {
    pageOffset.value = 1
    return
  }
  // Heuristic: count elements intended to force page breaks.
  // UnoCSS utility `break-after-page` is commonly used.
  // If none found, assume a single-page cover.
  const blocks = el.querySelectorAll('.break-after-page')
  pageOffset.value = Math.max(1, blocks.length)
}

onMounted(async () => {
  await nextTick()
  recountCoverPages()
})

watchEffect(() => {
  // Recount when toggling cover or when printing state changes
  if (isPrintMode.value)
    recountCoverPages()
})
</script>

<template>
  <div id="page-root" ref="root" :style="themeVars">
    <!-- Optional cover block(s) when ?cover is present -->
    <div v-if="includeCover" ref="coverRoot">
      <HandoutCover />
    </div>
    <PrintContainerHandout
      class="w-full h-full"
      :width="rootWidth || windowSize.width.value"
      :page-offset="pageOffset"
    />
  </div>
</template>

<style>
html.print,
html.print body,
html.print #app {
  height: auto;
  overflow: auto;
}
/* Force white paper background in print */
html.print,
html.print body {
  background: #ffffff !important;
  color-scheme: light;
}
html.print #page-root {
  height: auto;
  /* Allow content to extend across multiple printed pages */
  overflow: visible;
}
html.print * {
  -webkit-print-color-adjust: exact;
}
html.print {
  width: 100%;
  height: 100%;
  overflow: visible;
}
html.print body {
  margin: 0 auto;
  border: 0;
  padding: 0;
  float: none;
  overflow: visible;
}

/* Cover content may contain its own break-after-page blocks to form pages */

@page {
  size: A4;
  margin-top: 0cm;
  margin-bottom: 0cm;
  margin-left: 0cm;
  margin-right: 0cm;
}
</style>
