<script setup lang="ts">
import type { Ref } from 'vue'
import HandoutCover from '#slidev/global-components/handout-cover'
import HandoutEnding from '#slidev/global-components/handout-ending'
import { useElementSize } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useNav } from '../../composables/useNav'
import { useHandoutPageSetup } from '../../composables/usePrintStyles'
import { themeVars } from '../../env'
import PrintContainerHandout from '../../internals/PrintContainerHandout.vue'
import { windowSize } from '../../state'

const { isPrintMode, printRange } = useNav()

useHandoutPageSetup('handout')

const root = ref<HTMLElement | null>(null)
const { width: rootWidth } = useElementSize(root)
const route = useRoute()
const includeCover = computed(() => route.query.cover != null)
const includeEnding = computed(() => route.query.ending != null)
const coverRoot = ref<HTMLElement | null>(null)
const endingRoot = ref<HTMLElement | null>(null)
const pageOffset = ref(0)
const endingPageCount = ref(0)

const slidePageCount = computed(() => printRange.value.length)
const endingPageDisplayCount = computed(() => includeEnding.value ? endingPageCount.value : 0)
const endingPageStart = computed(() => pageOffset.value + slidePageCount.value + 1)
const totalPageCount = computed(() => pageOffset.value + slidePageCount.value + endingPageDisplayCount.value)

watchEffect(() => {
  const html = document.body.parentNode as HTMLElement
  if (isPrintMode.value)
    html.classList.add('print')
  else
    html.classList.remove('print')
})

function detectPageBlocks(el: HTMLElement | null, fallback: number) {
  if (!el)
    return fallback
  const hasContent = el.childElementCount > 0
  const selectors = ['.break-after-page', '[data-handout-page]']
  const candidates = new Set<HTMLElement>(Array.from(el.querySelectorAll<HTMLElement>(selectors.join(','))))
  const inlineBreaks = Array.from(el.querySelectorAll<HTMLElement>('[style]')).filter((node) => {
    const style = node.getAttribute('style') || ''
    return /page-break-after\s*:\s*always/i.test(style) || /break-after\s*:\s*page/i.test(style)
  })
  inlineBreaks.forEach(node => candidates.add(node))
  if (candidates.size > 0)
    return candidates.size
  const directChildren = Array.from(el.children).filter((node): node is HTMLElement => node instanceof HTMLElement)
  const directCount = directChildren.filter(node => node.classList.contains('break-after-page') || node.hasAttribute('data-handout-page')).length
  if (directCount > 0)
    return directCount
  return hasContent ? Math.max(1, fallback) : fallback
}

function recountCoverPages() {
  if (!includeCover.value) {
    pageOffset.value = 0
    return
  }
  pageOffset.value = Math.max(1, detectPageBlocks(coverRoot.value, 1))
}

function recountEndingPages() {
  if (!includeEnding.value) {
    endingPageCount.value = 0
    return
  }
  endingPageCount.value = detectPageBlocks(endingRoot.value, 0)
}

function setupMutationObserver(target: Ref<HTMLElement | null>, callback: () => void) {
  if (typeof MutationObserver === 'undefined')
    return
  let observer: MutationObserver | null = null
  watch(target, (el) => {
    observer?.disconnect()
    if (el) {
      observer = new MutationObserver(() => callback())
      observer.observe(el, { childList: true, subtree: true, attributes: true })
    }
  }, { immediate: true })
  onBeforeUnmount(() => observer?.disconnect())
}

setupMutationObserver(coverRoot, () => recountCoverPages())
setupMutationObserver(endingRoot, () => recountEndingPages())

onMounted(async () => {
  await nextTick()
  recountCoverPages()
  recountEndingPages()
})

watchEffect(() => {
  // Recount when toggling cover or when printing state changes
  if (isPrintMode.value) {
    recountCoverPages()
    recountEndingPages()
  }
})

watch(includeCover, async () => {
  await nextTick()
  recountCoverPages()
})

watch(includeEnding, async () => {
  await nextTick()
  recountEndingPages()
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
    <div v-if="includeEnding" ref="endingRoot">
      <HandoutEnding
        :page-start="endingPageStart"
        :page-count="endingPageDisplayCount"
        :total-pages="totalPageCount"
        :cover-count="pageOffset"
        :slide-count="slidePageCount"
      />
    </div>
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

/* Cover/ending content may contain their own break-after-page blocks to form pages */
</style>
