import serverDrawingState from 'server-reactive:drawings?diff'
import { configs } from '../env'
import { createSyncState } from './syncState'

export type DrawingsState = Record<number, string | undefined>

const { init, onPatch, patch, state } = createSyncState<DrawingsState>(serverDrawingState, {}, !!configs.drawings.persist)
export { init as initDrawingState, onPatch, patch, state as drawingState }
