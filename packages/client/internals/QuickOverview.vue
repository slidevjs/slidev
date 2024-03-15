<script setup lang="ts">
import { useEventListener, useVModel } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'
import { breakpoints, showOverview, windowSize } from '../state'
import { currentOverviewPage, overviewRowCount } from '../logic/overview'
import { createFixedClicks } from '../composables/useClicks'
import { getSlideClass } from '../utils'
import { CLICKS_MAX } from '../constants'
import { useNav } from '../composables/useNav'
import SlideContainer from './SlideContainer.vue'
import SlideWrapper from './SlideWrapper.vue'
import DrawingPreview from './DrawingPreview.vue'
import IconButton from './IconButton.vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])
const value = useVModel(props, 'modelValue', emit)

const { currentSlideNo, go: goSlide, slides } = useNav()

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
      class="bg-main !bg-opacity-75 p-16 py-20 overflow-y-auto backdrop-blur-5px fixed left-0 right-0 top-0 h-[calc(var(--vh,1vh)*100)]"
      @click="close()"
    >
      <div
        class="grid gap-y-4 gap-x-8 w-full"
        :style="`grid-template-columns: repeat(auto-fit,minmax(${cardWidth}px,1fr))`"
      >
        <div
          v-for="(route, idx) of slides"
          :key="route.no"
          class="relative"
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
                :is="route.component"
                v-if="route?.component"
                :clicks-context="createFixedClicks(route, CLICKS_MAX)"
                :class="getSlideClass(route)"
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
  </Transition>
  <div v-if="value" class="fixed top-4 right-4 text-gray-400 flex flex-col items-center gap-2">
    <IconButton title="Close" class="text-2xl" @click="close">
      <carbon:close />
    </IconButton>
    <IconButton
      v-if="__DEV__"
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
