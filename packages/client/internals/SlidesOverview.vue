<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, defineEmit, defineProps } from 'vue'
import { useNavigateControls } from '../logic/controls'
import { targetWidth, targetHeight } from '../logic/scale'

const emit = defineEmit()
const props = defineProps<{ modelValue: boolean }>()

const value = useVModel(props, 'modelValue', emit)

const { routes } = useNavigateControls()

const scale = 0.3
const cardWidth = targetWidth * scale
const innerStyle = computed(() => ({
  height: `${targetHeight}px`,
  width: `${targetWidth}px`,
  transformOrigin: 'top left',
  transform: `scale(${scale})`,
}))
const style = computed(() => ({
  height: `${targetHeight * scale}px`,
  width: `${targetWidth * scale}px`,
}))
</script>

<template>
  <div
    v-if="value"
    class="bg-main !bg-opacity-75 p-20 fixed left-0 right-0 top-0 bottom-0 overflow-y-auto"
    style="backdrop-filter: blur(5px);"
  >
    <div
      class="grid gap-y-4 gap-x-8 w-full"
      :style="`grid-template-columns: repeat(auto-fit,minmax(${cardWidth}px,1fr))`"
    >
      <div
        v-for="(route, idx) of routes.slice(0, -1)"
        :key="route.path"
        :style="style"
        class="relative"
      >
        <RouterLink
          :to="route.path"
          :style="style"
          class="block border border-gray-400 rounded border-opacity-50 overflow-hidden bg-main hover:(border-primary)"
          @click="value = false"
        >
          <div :style="innerStyle" class="pointer-events-none" v-click-disabled>
            <component :is="route.component"/>
          </div>
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
</template>
