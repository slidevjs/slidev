<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed } from 'vue'
import { breakpoints, windowSize } from '../state'
import { go as goSlide, rawRoutes } from '../logic/nav'
import { getSlideClass } from '../utils'
import SlideContainer from './SlideContainer.vue'
import SlideWrapper from './SlideWrapper'
import DrawingPreview from './DrawingPreview.vue'

const emit = defineEmits([])
const props = defineProps<{ modelValue: boolean }>()

const value = useVModel(props, 'modelValue', emit)

function close() {
  value.value = false
}

function go(page: number) {
  goSlide(page)
  close()
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
</script>

<template>
  <div
    v-show="value"
    class="slides-overview bg-main !bg-opacity-75 p-16 overflow-y-auto"
  >
    <div
      class="grid gap-y-4 gap-x-8 w-full"
      :style="`grid-template-columns: repeat(auto-fit,minmax(${cardWidth}px,1fr))`"
    >
      <div
        v-for="(route, idx) of rawRoutes.slice(0, -1)"
        :key="route.path"
        class="relative"
      >
        <div
          class="inline-block border border-gray-400 rounded border-opacity-50 overflow-hidden bg-main hover:(border-$slidev-theme-primary)"
          @click="go(+route.path)"
        >
          <SlideContainer
            :key="route.path"
            :width="cardWidth"
            :clicks-disabled="true"
            class="pointer-events-none"
          >
            <SlideWrapper
              :is="route?.component"
              :clicks-disabled="true"
              :class="getSlideClass(route)"
            />
            <DrawingPreview :page="+route.path" />
          </SlideContainer>
        </div>
        <div
          class="absolute top-0 opacity-50"
          :style="`left: ${cardWidth + 5}px`"
        >
          {{ idx + 1 }}
        </div>
      </div>
    </div>
  </div>
  <button v-if="value" class="fixed text-2xl top-4 right-4 icon-btn text-gray-400" @click="close">
    <carbon:close />
  </button>
</template>

<style lang="postcss">
.slides-overview {
  @apply fixed left-0 right-0 top-0;
  backdrop-filter: blur(5px);
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
}
</style>
