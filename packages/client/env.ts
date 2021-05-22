import { SlidevConfig } from '@slidev/types'
import { computed } from 'vue'
import { objectMap } from '@antfu/utils'
// @ts-ignore
import _configs from '/@slidev/configs'

export const configs = _configs as SlidevConfig

export const slideAspect = configs.aspectRatio ?? (16 / 9)
export const slideWidth = configs.canvasWidth ?? 980
export const slideHeight = Math.round(slideWidth / slideAspect)

export const themeVars = computed(() => {
  return objectMap(configs.themeConfig || {}, (k, v) => [`--slidev-theme-${k}`, v])
})
