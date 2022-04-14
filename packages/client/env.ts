import type { SlidevConfig } from '@slidev/types'
import { computed } from 'vue'
import { objectMap } from '@antfu/utils'
// @ts-expect-error missing types
import _configs from '/@slidev/configs'
import _serverDrawingState from 'server-reactive:drawings?diff'
import type { ServerReactive } from 'vite-plugin-vue-server-ref'

export const serverDrawingState = _serverDrawingState as ServerReactive<Record<number, string | undefined>>
export const configs = _configs as SlidevConfig

export const slideAspect = configs.aspectRatio ?? (16 / 9)
export const slideWidth = configs.canvasWidth ?? 980
export const slideHeight = Math.round(slideWidth / slideAspect)

export const themeVars = computed(() => {
  return objectMap(configs.themeConfig || {}, (k, v) => [`--slidev-theme-${k}`, v])
})
