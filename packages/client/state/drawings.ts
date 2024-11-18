import serverDrawingState from 'server-reactive:drawings?diff'
import { createSyncState } from './syncState'

export type DrawingsState = Record<number, string | undefined>

export const {
  init: initDrawingState,
  onPatch: onPatchDrawingState,
  onUpdate: onDrawingUpdate,
  patch: patchDrawingState,
  state: drawingState,
} = createSyncState<DrawingsState>(serverDrawingState, serverDrawingState, __SLIDEV_FEATURE_DRAWINGS_PERSIST__)
