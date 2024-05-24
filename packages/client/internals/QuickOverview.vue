<script setup lang="ts">
import { useEventListener, useVirtualList } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'
import { breakpoints, showOverview, windowSize } from '../state'
import { currentOverviewPage, overviewRowCount } from '../logic/overview'
import { createFixedClicks } from '../composables/useClicks'
import { CLICKS_MAX } from '../constants'
import { useNav } from '../composables/useNav'
import { slideAspect } from '../env'
import SlideContainer from './SlideContainer.vue'
import SlideWrapper from './SlideWrapper.vue'
import DrawingPreview from './DrawingPreview.vue'
import IconButton from './IconButton.vue'

const { currentSlideNo, go: goSlide, slides } = useNav()

function close() {
  showOverview.value = false
}

function go(page: number) {
  goSlide(page)
  close()
}

function focus(page: number) {
  if (page === currentOverviewPage.value)
    return true
  return false
}

const xs = breakpoints.smaller('xs')
const sm = breakpoints.smaller('sm')

const padding = 4 * 16 * 2
const gap = 2 * 16
const cardWidth = computed(() => {
  if (xs.value)
    return windowSize.width.value - padding
  else if (sm.value)
    return (windowSize.width.value - padding - gap) / 2
  return 300
})

const cardHeight = computed(() => cardWidth.value / slideAspect.value)

const rowCount = computed(() => {
  return Math.floor((windowSize.width.value - padding) / (cardWidth.value + 2 * gap))
})

const numOfRows = computed(() => {
  return Math.ceil(slides.value.length / rowCount.value)
})

const slideRows = computed(() => {
  const cols = rowCount.value
  const slideRows = []
  for (let i = 0; i < numOfRows.value; i++) {
    const row = slides.value.slice(i * cols, (i + 1) * cols)
    slideRows.push(row.map((route, j) => ({ route, idx: i * cols + j })))
  }
  return slideRows
})

const { list: vList, containerProps, wrapperProps } = useVirtualList(
  slideRows,
  {
    itemHeight: cardHeight.value + gap,
    itemWidth: (cardWidth.value + gap) * rowCount.value,
    overscan: 3,
  },
)

const keyboardBuffer = ref<string>('')

useEventListener('keypress', (e) => {
  if (!showOverview.value) {
    keyboardBuffer.value = ''
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    if (keyboardBuffer.value) {
      go(+keyboardBuffer.value)
      keyboardBuffer.value = ''
    }
    else {
      go(currentOverviewPage.value)
    }
    return
  }
  const num = Number.parseInt(e.key.replace(/\D/g, ''))
  if (Number.isNaN(num)) {
    keyboardBuffer.value = ''
    return
  }
  if (!keyboardBuffer.value && num === 0)
    return

  keyboardBuffer.value += String(num)

  // beyond the number of slides, reset
  if (+keyboardBuffer.value >= slides.value.length) {
    keyboardBuffer.value = ''
    return
  }

  const extactMatch = slides.value.findIndex(i => `/${i.no}` === keyboardBuffer.value)
  if (extactMatch !== -1)
    currentOverviewPage.value = extactMatch + 1

  // When the input number is the largest at the number of digits, we go to that page directly.
  if (+keyboardBuffer.value * 10 > slides.value.length) {
    go(+keyboardBuffer.value)
    keyboardBuffer.value = ''
  }
})

watchEffect(() => {
  // Watch currentPage, make sure every time we open overview,
  // we focus on the right page.
  currentOverviewPage.value = currentSlideNo.value
  // Watch rowCount, make sure up and down shortcut work correctly.
  overviewRowCount.value = rowCount.value
})

const activeSlidesLoaded = ref(false)
setTimeout(() => {
  activeSlidesLoaded.value = true
}, 3000)
</script>

<template>
  <Transition
    enter-active-class="duration-150 ease-out"
    enter-from-class="opacity-0 scale-102 !backdrop-blur-0px"
    leave-active-class="duration-200 ease-in"
    leave-to-class="opacity-0 scale-102 !backdrop-blur-0px"
  >
    <div
      v-if="showOverview || activeSlidesLoaded"
      v-show="showOverview"
      v-bind="containerProps"
      class="fixed left-0 right-0 top-0 h-[calc(var(--vh,1vh)*100)] z-20 bg-main !bg-opacity-75 p-16 py-20 overflow-y-auto backdrop-blur-5px"
      @click="close"
    >
      <div v-bind="wrapperProps">
        <div
          v-for="{ index: rowIdx, data: row } of vList"
          :key="rowIdx"
          class="flex mb-8"
        >
          <div
            v-for="{ route, idx } of row"
            :key="route.no"
            class="relative flex-1"
          >
            <div
              class="inline-block border rounded overflow-hidden bg-main hover:border-primary transition"
              :class="(focus(idx + 1) || currentOverviewPage === idx + 1) ? 'border-primary' : 'border-main'"
              @click="go(route.no)"
            >
              <SlideContainer
                :key="route.no"
                :width="cardWidth"
                class="pointer-events-none"
              >
                <SlideWrapper
                  :clicks-context="createFixedClicks(route, CLICKS_MAX)"
                  :route="route"
                  render-context="overview"
                />
                <DrawingPreview :page="route.no" />
              </SlideContainer>
            </div>
            <div
              class="absolute top-0"
              :style="`left: ${cardWidth + 5}px`"
            >
              <template v-if="keyboardBuffer && String(idx + 1).startsWith(keyboardBuffer)">
                <span class="text-green font-bold">{{ keyboardBuffer }}</span>
                <span class="opacity-50">{{ String(idx + 1).slice(keyboardBuffer.length) }}</span>
              </template>
              <span v-else class="opacity-50">
                {{ idx + 1 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  <div v-if="showOverview" class="fixed top-4 right-4 z-20 text-gray-400 flex flex-col items-center gap-2">
    <IconButton title="Close" class="text-2xl" @click="close">
      <carbon:close />
    </IconButton>
    <IconButton
      v-if="__SLIDEV_FEATURE_PRESENTER__"
      as="a"
      title="Slides Overview"
      target="_blank"
      href="/overview"
      tab-index="-1"
      class="text-2xl"
    >
      <carbon:list-boxes />
    </IconButton>
  </div>
</template>
