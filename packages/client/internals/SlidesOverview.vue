<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, defineEmit, defineProps } from 'vue'
import { breakpoints, windowSize } from '../state'
import { useNavigateControls } from '../logic'
import SlideContainer from './SlideContainer.vue'

const emit = defineEmit()
const props = defineProps<{ modelValue: boolean }>()

const value = useVModel(props, 'modelValue', emit)

const { routes } = useNavigateControls()

function close() {
  value.value = false
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
        v-for="(route, idx) of routes.slice(0, -1)"
        :key="route.path"
        class="relative"
      >
        <RouterLink
          :to="route.path"
          class="inline-block border border-gray-400 rounded border-opacity-50 overflow-hidden bg-main hover:(border-primary)"
          @click="close"
        >
          <SlideContainer
            v-click-disabled
            :width="cardWidth"
            class="pointer-events-none"
          >
            <component :is="route.component" />
          </SlideContainer>
        </RouterLink>
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
