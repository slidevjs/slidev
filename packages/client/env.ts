import { SlidevConfig } from '@slidev/types'
import { computed, Ref } from 'vue'
import { objectMap } from '@antfu/utils'
// @ts-expect-error
import _configs from '/@slidev/configs'
// @ts-expect-error
import _serverState from '/@server-ref/state'

export interface ServerState {
  page: number
  clicks: number
  cursor?: {
    x: number
    y: number
  }
}

export const serverState = _serverState as Ref<ServerState>
export const configs = _configs as SlidevConfig

export const slideAspect = configs.aspectRatio ?? (16 / 9)
export const slideWidth = configs.canvasWidth ?? 980
export const slideHeight = Math.round(slideWidth / slideAspect)

export const themeVars = computed(() => {
  return objectMap(configs.themeConfig || {}, (k, v) => [`--slidev-theme-${k}`, v])
})
