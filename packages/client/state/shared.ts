// @ts-expect-error - virtual module
import serverState from 'server-reactive:nav'
import { createSyncState } from './syncState'

export interface SharedState {
  page: number
  clicks: number
  clicksTotal: number

  timer: {
    status: 'stopped' | 'running' | 'paused'
    slides: Record<number, {
      start?: number
      end?: number
    }>
    startedAt: number
    pausedAt: number
  }

  cursor?: {
    x: number
    y: number
  }

  lastUpdate?: {
    id: string
    type: 'presenter' | 'viewer'
    time: number
  }
}

const { init, onPatch, onUpdate, patch, state } = createSyncState<SharedState>(serverState, {
  page: 1,
  clicks: 0,
  clicksTotal: 0,
  timer: {
    status: 'stopped',
    slides: {},
    startedAt: 0,
    pausedAt: 0,
  },
})

export {
  init as initSharedState,
  onPatch,
  onUpdate as onSharedUpdate,
  patch,
  state as sharedState,
}
