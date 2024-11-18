import configs from '#slidev/configs'
import { objectMap } from '@antfu/utils'
import { computed } from 'vue'

export { configs }

export const mode = __DEV__ ? 'dev' : 'build'

export const slideAspect = computed(() => configs.aspectRatio)
export const slideWidth = computed(() => configs.canvasWidth)

// To honor the aspect ratio more as possible, we need to approximate the height to the next integer.
// Doing this, we will prevent on print, to create an additional empty white page after each page.
export const slideHeight = computed(() => Math.ceil(slideWidth.value / slideAspect.value))

export const themeVars = computed(() => {
  return objectMap(configs.themeConfig || {}, (k, v) => [`--slidev-theme-${k}`, v])
})

export const slidesTitle = configs.slidesTitle

export const pathPrefix = import.meta.env.BASE_URL + (__SLIDEV_HASH_ROUTE__ ? '#/' : '')
