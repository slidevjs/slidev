import { useWindowSize } from '@vueuse/core'
import { reactive, computed } from 'vue'

export const aspect = 16 / 9
export const targetWidth = 980
export const targetHeight = targetWidth / aspect

const screen = reactive(useWindowSize())
const screenAspect = computed(() => screen.width / screen.height)

export const scale = computed(() => {
  if (screenAspect.value < aspect)
    return screen.width / targetWidth
  return screen.height * aspect / targetWidth
})

export const marginTop = computed(() => (screen.height - targetHeight * scale.value) / 2)
export const marginLeft = computed(() => (screen.width - targetWidth * scale.value) / 2)
