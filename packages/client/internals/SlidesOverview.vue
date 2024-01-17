<script setup lang="ts">
import { useEventListener, useVModel } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'
import { themeVars } from '../env'
import { breakpoints, showOverview, windowSize } from '../state'
import { currentPage, go as goSlide, rawRoutes } from '../logic/nav'
import { currentOverviewPage, overviewRowCount } from '../logic/overview'
import { getSlideClass } from '../utils'
import SlideContainer from './SlideContainer.vue'
import SlideWrapper from './SlideWrapper'
import DrawingPreview from './DrawingPreview.vue'
import HiddenText from './HiddenText.vue'

const props = defineProps<{ modelValue: boolean }>()

const emit = defineEmits([])
const value = useVModel(props, 'modelValue', emit)

function close() {
  value.value = false
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

const rowCount = computed(() => {
  return Math.floor((windowSize.width.value - padding) / (cardWidth.value + gap))
})

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
  const num = Number.parseInt(e.key.replace(/[^0-9]/g, ''))
  if (Number.isNaN(num)) {
    keyboardBuffer.value = ''
    return
  }
  if (!keyboardBuffer.value && num === 0)
    return

  keyboardBuffer.value += String(num)

  // beyond the number of slides, reset
  if (+keyboardBuffer.value >= rawRoutes.length) {
    keyboardBuffer.value = ''
    return
  }

  const extactMatch = rawRoutes.findIndex(i => i.path === keyboardBuffer.value)
  if (extactMatch !== -1)
    currentOverviewPage.value = extactMatch + 1

  // When the input number is the largest at the number of digits, we go to that page directly.
  if (+keyboardBuffer.value * 10 > rawRoutes.length) {
    go(+keyboardBuffer.value)
    keyboardBuffer.value = ''
  }
})

watchEffect(() => {
  // Watch currentPage, make sure every time we open overview,
  // we focus on the right page.
  currentOverviewPage.value = currentPage.value
  // Watch rowCount, make sure up and down shortcut work correctly.
  overviewRowCount.value = rowCount.value
})
</script>

<template>
  <Transition
    enter-active-class="duration-150 ease-out"
    enter-from-class="opacity-0 scale-102 !backdrop-blur-0px"
    leave-active-class="duration-200 ease-in"
    leave-to-class="opacity-0 scale-102 !backdrop-blur-0px"
  >
    <div
      v-show="value"
      class="bg-main !bg-opacity-75 p-16 overflow-y-auto backdrop-blur-5px fixed left-0 right-0 top-0 h-[calc(var(--vh,1vh)*100)]"
      @click="close()"
    >
      <div
        class="grid gap-y-4 gap-x-8 w-full"
        :style="`grid-template-columns: repeat(auto-fit,minmax(${cardWidth}px,1fr))`"
      >
        <div
          v-for="(route, idx) of rawRoutes"
          :key="route.path"
          class="relative"
        >
          <div
            class="inline-block border rounded border-opacity-50 overflow-hidden bg-main hover:border-$slidev-theme-primary transition"
            :class="(focus(idx + 1) || currentOverviewPage === idx + 1) ? 'border-$slidev-theme-primary' : 'border-gray-400'"
            :style="themeVars"
            @click="go(+route.path)"
          >
            <SlideContainer
              :key="route.path"
              :width="cardWidth"
              :clicks-disabled="true"
              class="pointer-events-none"
            >
              <SlideWrapper
                :is="route.component"
                v-if="route?.component"
                :clicks-disabled="true"
                :class="getSlideClass(route)"
                :route="route"
                render-context="overview"
              />
              <DrawingPreview :page="+route.path" />
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
  </Transition>
  <button v-if="value" class="fixed text-2xl top-4 right-4 slidev-icon-btn text-gray-400" @click="close">
    <HiddenText text="Close" />
    <carbon:close />
  </button>
</template>
