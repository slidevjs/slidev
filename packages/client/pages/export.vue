<script setup lang="ts">
import type { ScreenshotSession } from '../logic/screenshot'
import { sleep } from '@antfu/utils'
import { parseRangeString } from '@slidev/parser/utils'
import { useHead } from '@unhead/vue'
import { provideLocal, useElementSize, useLocalStorage, useStyleTag, watchDebounced } from '@vueuse/core'
import { Tooltip } from 'floating-vue'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDarkMode } from '../composables/useDarkMode'
import { useNav } from '../composables/useNav'
import { injectionSlideScale } from '../constants'
import { configs, slideHeight, slidesTitle, slideWidth } from '../env'
import PrintSlide from '../internals/PrintSlide.vue'
import { startScreenshotSession } from '../logic/screenshot'
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
const delay = useLocalStorage('slidev-export-capture-delay', 400, { listenToStorageChanges: false })
type ScreenshotResult = { slideIndex: number, clickIndex: number, dataUrl: string }[]
const screenshotSession = ref<ScreenshotSession | null>(null)
const capturedImages = ref<ScreenshotResult | null>(null)
const title = ref(configs.exportFilename || slidesTitle)

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

    await sleep(initialWait.value + delay.value)
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
        await sleep(delay.value)
        next()
        await sleep(delay.value)
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
    class="fixed inset-0 flex flex-col md:flex-row md:gap-8 print:position-unset print:inset-0 print:block print:min-h-max justify-center of-hidden"
  >
    <div class="print:hidden min-w-fit flex flex-wrap md:flex-col gap-2 p-6 max-w-100">
      <h1 class="text-3xl md:my-4 flex items-center gap-2 w-full">
        <RouterLink to="/" class="i-carbon:previous-outline op-70 hover:op-100" />
        Export Slides
      </h1>
      <div>
        <h2> Settings </h2>
        <div class="flex flex-col gap-1">
          <label>
            <input v-model="isDark" type="checkbox" :disabled="isColorSchemaConfigured">
            <span> Dark mode </span>
          </label>
          <label>
            <input v-model="isPrintWithClicks" type="checkbox">
            <span> With clicks </span>
          </label>
          <label>
            <span> Title </span>
            <input v-model="title" type="text">
          </label>
          <label>
            <span> Ranges </span>
            <input v-model="rangesRaw" type="text" :placeholder="`1-${slides.length}`">
          </label>
          <label>
            <span class="flex gap-1">
              Delay
              <Tooltip popper-class="no-slide-scale">
                <sup class="i-carbon:information inline-block text-4 op-70" />
                <template #popper>
                  <div class="w-max text-sm p-2">
                    Delay between capturing each slide in milliseconds. <br>
                    Increase this value if slides are captured incompletely. <br>
                    (Not related to PDF export)
                  </div>
                </template>
              </Tooltip>
            </span>
            <input v-model="delay" type="number" step="50" min="50">
          </label>
        </div>
      </div>
      <div class="flex-grow" />
      <div class="min-w-fit">
        <h2> Export as vector file </h2>
        <div class="flex flex-col gap-2 items-start min-w-max">
          <button @click="pdf">
            PDF
          </button>
        </div>
        <h2> Rendered as <span border="b-1.5 gray" px-.2> {{ capturedImages ? 'Images' : 'DOM' }} </span> </h2>
        <div class="flex flex-col gap-2 items-start min-w-max">
          <button v-if="capturedImages" class="flex justify-center items-center gap-2" @click="capturedImages = null">
            <span class="i-carbon:trash-can inline-block text-xl" />
            Clear Captured Images
          </button>
          <button v-else class="flex justify-center items-center gap-2" @click="capturePngs">
            <div class="i-carbon:camera-action inline-block text-xl" />
            Capture Images
          </button>
        </div>
        <h2> Export as images </h2>
        <div class="flex flex-col gap-2 items-start min-w-max">
          <button @click="pptx">
            PPTX
          </button>
          <button @click="pngsGz">
            PNGs.gz
          </button>
        </div>
      </div>
    </div>
    <div id="export-container" ref="export-container">
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
  </div>
</template>

<style scoped>
@media not print {
  #export-container {
    scrollbar-width: thin;
    scroll-behavior: smooth;
    --uno: w-full overflow-x-hidden overflow-y-auto max-h-full max-w-300 p6;
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

button {
  --uno: 'w-full rounded bg-gray:10 px-4 py-2 hover:bg-gray/20';
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
  --uno: uppercase pt-1 tracking-widest font-500 op-70 my-2;
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
