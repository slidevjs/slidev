<script setup lang="ts">
import type { ScreenshotSession } from '../logic/screenshot'
import { sleep } from '@antfu/utils'
import { parseRangeString } from '@slidev/parser/utils'
import { useHead } from '@unhead/vue'
import { provideLocal, useElementSize, useStyleTag, watchDebounced } from '@vueuse/core'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDarkMode } from '../composables/useDarkMode'
import { useNav } from '../composables/useNav'
import { patchMonacoColors } from '../composables/usePrintStyles'
import { injectionSlideScale } from '../constants'
import { configs, slideHeight, slidesTitle, slideWidth } from '../env'
import ExportPdfTip from '../internals/ExportPdfTip.vue'
import FormCheckbox from '../internals/FormCheckbox.vue'
import FormItem from '../internals/FormItem.vue'
import PrintSlide from '../internals/PrintSlide.vue'
import SegmentControl from '../internals/SegmentControl.vue'
import { isScreenshotSupported, startScreenshotSession } from '../logic/screenshot'
import { captureDelay, skipExportPdfTip } from '../state'
import Play from './play.vue'

const { slides, isPrintWithClicks, hasNext, go, next, currentSlideNo, clicks, printRange } = useNav()
const router = useRouter()
const { isColorSchemaConfigured, isDark } = useDarkMode()
const { width: containerWidth } = useElementSize(useTemplateRef('export-container'))
const { height: contentHeight } = useElementSize(useTemplateRef('export-content'))
const scale = computed(() => containerWidth.value / slideWidth.value)
const contentMarginBottom = computed(() => `${contentHeight.value * (scale.value - 1)}px`)
const rangesRaw = ref('')
const initialWait = ref(1000)
type ScreenshotResult = { slideIndex: number, clickIndex: number, dataUrl: string }[]
const screenshotSession = ref<ScreenshotSession | null>(null)
const capturedImages = ref<ScreenshotResult | null>(null)
const title = ref(configs.exportFilename || slidesTitle)

useHead({
  title,
})

provideLocal(injectionSlideScale, scale)

const showExportPdfTip = ref(false)
function pdf() {
  if (skipExportPdfTip.value) {
    doPrint()
  }
  else {
    showExportPdfTip.value = true
  }
}

function doPrint() {
  patchMonacoColors()
  setTimeout(window.print, 100)
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

    await sleep(initialWait.value + captureDelay.value)
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
        await sleep(captureDelay.value)
        next()
        await sleep(captureDelay.value)
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
  const pptx = await import('pptxgenjs')
    .then(r => r.default)
    .then(PptxGen => new PptxGen())

  const layoutName = `${slideWidth.value}x${slideHeight.value}`
  pptx.defineLayout({
    name: layoutName,
    width: slideWidth.value / 96,
    height: slideHeight.value / 96,
  })
  pptx.layout = layoutName
  if (configs.author)
    pptx.author = configs.author
  pptx.company = 'Created using Slidev'
  pptx.title = title.value
  if (typeof configs.info === 'string')
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

async function pngsGz() {
  const pngs = await capturePngs()
  if (!pngs)
    return
  const { createTarGzip } = await import('nanotar')
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

useStyleTag(computed(() => screenshotSession.value?.isActive
  ? `
html {
  cursor: none;
  margin-bottom: 20px;
}
body {
  pointer-events: none;
}`
  : `
:root {
  --slidev-slide-scale: ${scale.value};
}
`))

// clear captured images when settings changed
watch(
  [
    isDark,
    printRange,
    isPrintWithClicks,
  ],
  () => capturedImages.value = null,
)

watchDebounced(
  [slides, rangesRaw],
  () => printRange.value = parseRangeString(slides.value.length, rangesRaw.value),
  { debounce: 300 },
)

// clear captured images when HMR
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    capturedImages.value = null
  })
}
</script>

<template>
  <Play v-if="screenshotSession?.isActive" />
  <div
    v-else
    class="fixed inset-0 flex flex-col md:flex-row md:gap-8 print:position-unset print:inset-0 print:block print:min-h-max justify-center of-hidden bg-main"
  >
    <div class="print:hidden min-w-fit flex flex-wrap md:flex-nowrap md:of-y-auto md:flex-col gap-2 p-6 max-w-100">
      <h1 class="text-3xl md:my-4 flex items-center gap-2 w-full">
        <RouterLink to="/" class="i-carbon:previous-outline op-70 hover:op-100" />
        Browser Exporter
        <sup op50 italic text-sm>Experimental</sup>
      </h1>
      <div flex="~ col gap-2">
        <h2>Options</h2>
        <FormItem title="Title">
          <input v-model="title" type="text">
        </FormItem>
        <FormItem title="Range">
          <input v-model="rangesRaw" type="text" :placeholder="`1-${slides.length}`">
        </FormItem>
        <FormItem title="Color Mode">
          <SegmentControl
            v-model="isDark"
            :options="[
              { value: false, label: 'Light' },
              { value: true, label: 'Dark' },
            ]"
            :disabled="isColorSchemaConfigured"
          />
        </FormItem>
        <FormItem title="With clicks">
          <FormCheckbox v-model="isPrintWithClicks" />
        </FormItem>
      </div>
      <div class="flex-grow" />
      <div class="min-w-fit" flex="~ col gap-3">
        <div border="~ main rounded-lg" p3 flex="~ col gap-2">
          <h2>Export as Vector File</h2>
          <div class="flex flex-col gap-2 min-w-max">
            <button class="slidev-form-button" @click="pdf">
              PDF
            </button>
          </div>
        </div>

        <div border="~ main rounded-lg" p3 flex="~ col gap-2" :class="isScreenshotSupported ? '' : 'border-orange'">
          <h2>Export as Images</h2>
          <div v-if="!isScreenshotSupported" class="min-w-full w-0 text-orange/100 p-1 mb-2 bg-orange/10 rounded">
            <span class="i-carbon:warning-alt inline-block mb--.5" />
            Your browser may not support image capturing.
            If you encounter issues, please use a modern Chromium-based browser,
            or export via the CLI.
          </div>
          <div class="flex flex-col gap-2 min-w-max">
            <button class="slidev-form-button" @click="pptx">
              PPTX
            </button>
            <button class="slidev-form-button" @click="pngsGz">
              PNGs.gz
            </button>
          </div>
          <div w-full h-1px border="t main" my2 />
          <div class="relative flex flex-col gap-2 flex-nowrap">
            <div class="flex flex-col gap-2 min-w-max">
              <button v-if="capturedImages" class="slidev-form-button flex justify-center items-center gap-2" @click="capturedImages = null">
                <span class="i-carbon:trash-can inline-block text-xl" />
                Clear Captured Images
              </button>
              <button v-else class="slidev-form-button flex justify-center items-center gap-2" @click="capturePngs">
                <div class="i-carbon:drop-photo inline-block text-xl" />
                Pre-capture slides as Images
              </button>
              <FormItem title="Delay" description="Delay between capturing each slide in milliseconds.<br>Increase this value if slides are captured incompletely. <br>(Not related to PDF export)">
                <input v-model="captureDelay" type="number" step="50" min="50">
              </FormItem>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="export-container" ref="export-container" relative>
      <div print:hidden fixed right-5 bottom-5 px2 py0 z-label slidev-glass-effect>
        <span op75>Rendering as {{ capturedImages ? 'Captured Images' : 'DOM' }} </span>
      </div>
      <div v-show="!capturedImages" id="export-content" ref="export-content">
        <PrintSlide v-for="route, index in slides" :key="index" :hidden="!printRange.includes(index + 1)" :route />
      </div>
      <div v-if="capturedImages" id="export-content-images" class="print:hidden grid">
        <div v-for="png, i of capturedImages" :key="i" class="print-slide-container">
          <img :src="png.dataUrl">
        </div>
      </div>
    </div>
    <div id="twoslash-container" />
    <ExportPdfTip v-model="showExportPdfTip" @print="doPrint" />
  </div>
</template>

<style scoped>
@media not print {
  #export-container {
    scrollbar-width: thin;
    scroll-behavior: smooth;
    --uno: w-full overflow-x-hidden overflow-y-auto max-h-full max-w-300 p-6;
  }

  #export-content {
    transform: v-bind('`scale(${scale})`');
    margin-bottom: v-bind('contentMarginBottom');
    --uno: origin-tl;
  }

  #export-content,
  #export-content-images {
    --uno: flex flex-col gap-2;
  }
}

@media print {
  #export-content {
    transform: scale(1);
    display: block !important;
  }
}

label {
  --uno: text-xl flex gap-2 items-center select-none;

  span {
    --uno: flex-grow;
  }

  input[type='text'],
  input[type='number'] {
    --uno: border border-main rounded px-2 py-1;
  }
}

h2 {
  --uno: font-500 op-70;
}

#export-content {
  --uno: pointer-events-none;
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

@media not print {
  #export-content-images .print-slide-container,
  #export-content .print-slide-container {
    --uno: border border-main rounded-md shadow of-hidden;
  }
}
</style>
