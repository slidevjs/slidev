import serverState from 'server-reactive:nav'
import { createSyncState } from './syncState'

export interface SharedState {
  page: number
  clicks: number
  clicksTotal: number

  cursor?: {
    x: number
    y: number
  }

  viewerPage: number
  viewerClicks: number
  viewerClicksTotal: number

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
  viewerPage: 1,
  viewerClicks: 0,
  viewerClicksTotal: 0,
})

export {
  init as initSharedState,
  onPatch,
  onUpdate as onSharedUpdate,
  patch,
  state as sharedState,
}
