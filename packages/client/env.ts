import type { SlidevConfig } from '@slidev/types'
import { computed } from 'vue'
import { objectMap } from '@antfu/utils'
// @ts-expect-error missing types
import _configs from '/@slidev/configs'

export const configs = _configs as SlidevConfig
export const slideAspect = configs.aspectRatio ?? (16 / 9)
export const slideWidth = configs.canvasWidth ?? 980

// The height must be an integer (apply round) and it should honors the aspect ratio more as possible.
// Also, to prevent errors on PDF export, we need to increase the height by 1px at time until the real
// aspect ratio is equal or less than the requested one.
// Doing this, we will prevent to create empty white pages after all single pages.
let calculatedHeight = Math.round(slideWidth / slideAspect)
while (slideAspect < (slideWidth / calculatedHeight))
  calculatedHeight++

export const slideHeight = calculatedHeight

export const themeVars = computed(() => {
  return objectMap(configs.themeConfig || {}, (k, v) => [`--slidev-theme-${k}`, v])
})
