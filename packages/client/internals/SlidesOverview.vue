<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, defineEmit, defineProps } from 'vue'
import { breakpoints, windowSize } from '../state'
import { go as goSlide, rawRoutes } from '../logic/nav'
import SlideContainer from './SlideContainer.vue'

const emit = defineEmit()
const props = defineProps<{ modelValue: boolean }>()

const value = useVModel(props, 'modelValue', emit)

function close() {
  value.value = false
}

function go(page: number) {
  goSlide(page)
  close()
}

const sm = breakpoints.smaller('sm')
const md = breakpoints.smaller('md')

const padding = 4 * 16 * 2
const gap = 2 * 16
const cardWidth = computed(() => {
  if (sm.value)
    return windowSize.width.value - padding
  else if (md.value)
    return (windowSize.width.value - padding - gap) / 2
  return 300
})
</script>

<template>
  <div
    v-if="value"
    class="bg-main !bg-opacity-75 p-16 fixed left-0 right-0 top-0 bottom-0 overflow-y-auto"
    style="backdrop-filter: blur(5px);"
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
          class="inline-block border border-gray-400 rounded border-opacity-50 overflow-hidden bg-main hover:(border-primary)"
          @click="go(+route.path)"
        >
          <SlideContainer
            :key="route.path"
            :width="cardWidth"
            :route="route"
            :tab-disabled="true"
            class="pointer-events-none"
          />
        </div>
        <div
          class="absolute top-0 opacity-50"
          :style="`left: ${cardWidth + 5}px`"
        >
          {{ idx }}
        </div>
      </div>
    </div>
  </div>
  <button v-if="value" class="fixed text-2xl top-4 right-4 icon-btn" @click="close">
    <carbon:close />
  </button>
</template>
