<script setup lang="ts">
import type { ScreenshotSession } from '../logic/screenshot'
import { sleep } from '@antfu/utils'
import { parseRangeString } from '@slidev/parser/utils'
import { useHead } from '@unhead/vue'
import { provideLocal, useElementSize, useStyleTag } from '@vueuse/core'
import { createTarGzip } from 'nanotar'
import PptxGenJS from 'pptxgenjs'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDarkMode } from '../composables/useDarkMode'
import { useNav } from '../composables/useNav'
import { injectionSlideScale } from '../constants'
import { configs, slideHeight, slidesTitle, slideWidth } from '../env'
import PrintSlide from '../internals/PrintSlide.vue'
import { startScreenshotSession } from '../logic/screenshot'
import Play from './play.vue'

const { slides, isPrintWithClicks, hasNext, go, next, currentSlideNo, clicks } = useNav()
const router = useRouter()
const { isColorSchemaConfigured, isDark } = useDarkMode()
const container = useTemplateRef('print-container')
const { width: containerWidth } = useElementSize(container)
const scale = computed(() => containerWidth.value / slideWidth.value)
const ranges = ref('')
const initialWait = ref(1000)
const nextWait = ref(600)
type ScreenshotResult = { slideIndex: number, clickIndex: number, dataUrl: string }[]
const screenshotSession = ref<ScreenshotSession | null>(null)
const capturedImages = ref<ScreenshotResult | null>(null)
const title = ref(configs.exportFilename || slidesTitle)
const routes = computed(() => parseRangeString(slides.value.length, ranges.value).map(i => slides.value[i - 1]))

useHead({
  title,
})

provideLocal(injectionSlideScale, scale)

function pdf() {
  window.print()
}

async function capturePngs() {
  if (screenshotSession.value) {
    screenshotSession.value.dispose()
    screenshotSession.value = null
  }
  if (capturedImages.value)
    return capturedImages.value
  try {
    const scale = 2
    screenshotSession.value = await startScreenshotSession(slideWidth.value * scale, slideHeight.value * scale)
    const result: ScreenshotResult = []

    go(1, 0, true)

    await sleep(initialWait.value)
    while (true) {
      if (!screenshotSession.value) {
        break
      }
      result.push({
        slideIndex: currentSlideNo.value - 1,
        clickIndex: clicks.value,
        dataUrl: screenshotSession.value.screenshot(document.getElementById('slide-content')!),
      })
      if (hasNext.value) {
        await sleep(nextWait.value)
        next()
        await sleep(nextWait.value)
      }
      else {
        break
      }
    }

    if (screenshotSession.value) {
      screenshotSession.value.dispose()
      capturedImages.value = result
      screenshotSession.value = null
    }
  }
  catch (e) {
    console.error(e)
    capturedImages.value = null
  }
  finally {
    router.push('/export')
  }
  return capturedImages.value
}

async function pptx() {
  const pngs = await capturePngs()
  if (!pngs)
    return
  const pptx = new PptxGenJS()

  const layoutName = `${slideWidth.value}x${slideHeight.value}`
  pptx.defineLayout({
    name: layoutName,
    width: slideWidth.value / 96,
    height: slideHeight.value / 96,
  })
  pptx.layout = layoutName
  pptx.author = configs.author
  pptx.company = 'Created using Slidev'
  pptx.title = title.value
  if (configs.info)
    pptx.subject = configs.info

  pngs.forEach(({ slideIndex, dataUrl }) => {
    const slide = pptx.addSlide()
    slide.background = {
      data: dataUrl,
    }

    const note = slides.value[slideIndex].meta.slide.note
    if (note)
      slide.addNotes(note)
  })

  const blob = await pptx.write({
    outputType: 'blob',
    compression: true,
  }) as Blob
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.value}.pptx`
  a.click()
}

async function pngsZip() {
  const pngs = await capturePngs()
  if (!pngs)
    return
  const data = await createTarGzip(
    pngs.map(({ slideIndex, dataUrl }) => ({
      name: `${slideIndex}.png`,
      data: new Uint8Array(atob(dataUrl.split(',')[1]).split('').map(char => char.charCodeAt(0))),
    })),
  )
  const a = document.createElement('a')
  const blob = new Blob([data], { type: 'application/gzip' })
  a.href = URL.createObjectURL(blob)
  a.download = `${title.value}.tar.gz`
  a.click()
}

useStyleTag(computed(() => screenshotSession.value
  ? `
  html {
    cursor: none;
    margin-bottom: 20px;
  }
  body {
    pointer-events: none;
  }
`
  : ''))

// clear captured images when settings changed
watch([
  isDark,
  ranges,
  isPrintWithClicks,
], () => capturedImages.value = null)

// clear captured images when HMR
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    capturedImages.value = null
  })
}
</script>

<template>
  <div
    v-if="!screenshotSession"
    class="fixed inset-6 flex flex-col md:flex-row gap-8 print:position-unset print:inset-0 print:block print:min-h-max"
  >
    <div class="print:hidden min-w-fit flex md:flex-col gap-4">
      <h1 class="text-3xl my-4 print:hidden">
        Export Slides
      </h1>
      <div class="flex flex-col">
        <label class="text-xl flex gap-2 items-center select-none">
          <span> Dark mode </span>
          <input v-model="isDark" type="checkbox" :disabled="isColorSchemaConfigured">
        </label>
        <label class="text-xl flex gap-2 items-center select-none">
          <span> With clicks </span>
          <input v-model="isPrintWithClicks" type="checkbox">
        </label>
        <label class="text-xl flex gap-2 items-center select-none">
          <span> Title </span>
          <input v-model="title" type="text">
        </label>
      </div>
      <div class="flex-grow" />
      <div class="flex flex-col gap-2 items-start min-w-max">
        <button v-if="capturedImages" @click="capturedImages = null">
          Clear Captured Images
        </button>
        <button v-else @click="capturePngs">
          Capture Images
        </button>
        <button @click="pdf">
          Export to PDF
        </button>
        <button @click="pptx">
          Export to PPTX
        </button>
        <button @click="pngsZip">
          Export to Images
        </button>
      </div>
    </div>
    <div id="print-container" ref="print-container">
      <div v-show="!capturedImages" id="print-content">
        <PrintSlide v-for="route of routes" :key="route.no" :route="route" />
        <div id="twoslash-container" />
      </div>
      <div v-if="capturedImages" class="print:hidden grid">
        <div v-for="png, i of capturedImages" :key="i">
          <img :src="png.dataUrl">
        </div>
      </div>
    </div>
  </div>
  <Play v-else />
</template>

<style scoped>
@media not print {
  #print-container {
    scrollbar-width: thin;
    scroll-behavior: smooth;
    @apply w-full overflow-x-hidden overflow-y-auto outline outline-main outline-solid max-h-full;
  }

  #print-content {
    transform: v-bind('`scale(${scale})`');
    @apply origin-tl flex flex-col;
  }
}

@media print {
  .scaler {
    transform: scale(1);
  }

  #print-content {
    display: block !important;
  }
}

button {
  @apply w-full rounded bg-gray:10 px-4 py-2 hover:bg-gray/20;
}

#print-content {
  @apply pointer-events-none;
}
</style>

<style>
@media print {
  html,
  body,
  #app {
    overflow: unset !important;
  }
}
</style>
