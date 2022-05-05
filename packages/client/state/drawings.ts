import serverDrawingState from 'server-reactive:drawings?diff'
import { createSyncState } from './syncState'

export type DrawingsState = Record<number, string | undefined>

const { init, onPatch, patch, state } = createSyncState<DrawingsState>(serverDrawingState, {}, __SLIDEV_FEATURE_DRAWINGS_PERSIST__)
export { init as initDrawingState, onPatch, patch, state as drawingState }
