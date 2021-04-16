<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, defineEmit, defineProps } from 'vue'
import { useNavigateControls } from '~/logic/controls'
import { targetWidth, targetHeight } from '~/logic/scale'

const emit = defineEmit()
const props = defineProps<{ modelValue: boolean }>()

const value = useVModel(props, 'modelValue', emit)

const { routes } = useNavigateControls()

const scale = 0.25
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
      style="grid-template-columns: repeat(auto-fit,minmax(220px,1fr));"
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
          <div :style="innerStyle" class="pointer-events-none">
            <KeepAlive>
              <component :is="route.component" v-click-disabled />
            </KeepAlive>
          </div>
        </RouterLink>
        <div class="absolute top-0 left-225px opacity-50">
          {{ idx }}
        </div>
      </div>
    </div>
  </div>
</template>
