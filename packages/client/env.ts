import type { SlidevConfig } from '@slidev/types'
import { computed } from 'vue'
import { objectMap } from '@antfu/utils'
// @ts-expect-error missing types
import _configs from '/@slidev/configs'
import _serverState from 'server-reactive:nav'
import _serverDrawingState from 'server-reactive:drawings?diff'
import type { ServerReactive } from 'vite-plugin-vue-server-ref'

export interface ServerState {
  page: number
  clicks: number
  cursor?: {
    x: number
    y: number
  }
}

export const serverState = _serverState as ServerReactive<ServerState>
export const serverDrawingState = _serverDrawingState as ServerReactive<Record<number, string | undefined>>
export const configs = _configs as SlidevConfig

export const slideAspect = configs.aspectRatio ?? (16 / 9)
export const slideWidth = configs.canvasWidth ?? 980
export const slideHeight = Math.round(slideWidth / slideAspect)

export const themeVars = computed(() => {
  return objectMap(configs.themeConfig || {}, (k, v) => [`--slidev-theme-${k}`, v])
})
