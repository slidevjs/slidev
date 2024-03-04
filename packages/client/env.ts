import { computed, ref } from 'vue'
import { objectMap } from '@antfu/utils'
import configs from '#slidev/configs'

export { configs }

export const slideAspect = ref(configs.aspectRatio ?? (16 / 9))
export const slideWidth = ref(configs.canvasWidth ?? 980)

// To honor the aspect ratio more as possible, we need to approximate the height to the next integer.
// Doing this, we will prevent on print, to create an additional empty white page after each page.
export const slideHeight = computed(() => Math.ceil(slideWidth.value / slideAspect.value))

export const themeVars = computed(() => {
  return objectMap(configs.themeConfig || {}, (k, v) => [`--slidev-theme-${k}`, v])
})
