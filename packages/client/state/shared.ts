import serverState from 'server-reactive:nav'
import { createSyncState } from './syncState'

export interface SharedState {
  page: number
  clicks: number
  cursor?: {
    x: number
    y: number
  }

  viewerPage: number
  viewerClicks: number

  lastUpdate?: {
    id: string
    type: 'presenter' | 'viewer'
    time: number
  }
}

const { init, onPatch, patch, state } = createSyncState<SharedState>(serverState, {
  page: 1,
  clicks: 0,
  viewerPage: 1,
  viewerClicks: 0,
})

export {
  init as initSharedState,
  onPatch,
  patch,
  state as sharedState,
}
