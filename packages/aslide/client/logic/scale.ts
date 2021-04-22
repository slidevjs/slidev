import { useWindowSize } from '@vueuse/core'
import { computed, ref } from 'vue'

export const aspect = 16 / 9
export const targetWidth = 980
export const targetHeight = targetWidth / aspect

export const offsetRight = ref(0)
export const offsetBottom = ref(0)

const { width: winWidth, height: winHeight } = useWindowSize()

const width = computed(() => winWidth.value - offsetRight.value)
const height = computed(() => winHeight.value - offsetBottom.value)
const screenAspect = computed(() => width.value / height.value)

export const scale = computed(() => {
  if (screenAspect.value < aspect)
    return width.value / targetWidth
  return height.value * aspect / targetWidth
})

export const marginTop = computed(() => (height.value - targetHeight * scale.value) / 2)
export const marginLeft = computed(() => (width.value - targetWidth * scale.value) / 2)
