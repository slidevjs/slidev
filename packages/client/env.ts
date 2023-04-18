import type { SlidevConfig } from '@slidev/types'
import { computed } from 'vue'
import { objectMap } from '@antfu/utils'

// @ts-expect-error missing types
import _configs from '/@slidev/configs'

export const configs = _configs as SlidevConfig
export const slideAspect = configs.aspectRatio ?? (16 / 9)
export const slideWidth = configs.canvasWidth ?? 980
// To honor the aspect ratio more as possible, we need to approximate the height to the next integer.
// Doing this, we will prevent on print, to create an additional empty white page after each page.
export const slideHeight = Math.ceil(slideWidth / slideAspect)

export const themeVars = computed(() => {
  return objectMap(configs.themeConfig || {}, (k, v) => [`--slidev-theme-${k}`, v])
})
