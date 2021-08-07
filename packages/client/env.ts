import { SlidevConfig } from '@slidev/types'
import { computed, Ref } from 'vue'
import { objectMap } from '@antfu/utils'
// @ts-expect-error
import _configs from '/@slidev/configs'
// @ts-expect-error
import _serverState from '/@server-ref/state'
// @ts-expect-error
import _serverDrawingState from '/@server-ref/drawings'

export interface ServerState {
  page: number
  clicks: number
  cursor?: {
    x: number
    y: number
  }
}

export type ServerRef<T> = Ref<T> & { receive: boolean; send: boolean }

export const serverState = _serverState as ServerRef<ServerState>
export const serverDrawingState = _serverDrawingState as ServerRef<Record<number, string | undefined>>
export const configs = _configs as SlidevConfig

export const slideAspect = configs.aspectRatio ?? (16 / 9)
export const slideWidth = configs.canvasWidth ?? 980
export const slideHeight = Math.round(slideWidth / slideAspect)

export const themeVars = computed(() => {
  return objectMap(configs.themeConfig || {}, (k, v) => [`--slidev-theme-${k}`, v])
})
