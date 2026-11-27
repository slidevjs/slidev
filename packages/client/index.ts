/**
 * This file is the public APIs that you might use in your app.
 *
 * The other files despite they are accessable, are not meant to be used directly, breaking changes might happen.
 */

export { useDarkMode } from './composables/useDarkMode'
export { useDrawings } from './composables/useDrawings'
export { useNav } from './composables/useNav'

export { useSlideContext } from './context'

export * from './env'
export * from './layoutHelper'

export {
  onSlideEnter,
  onSlideLeave,
  useIsSlideActive,
} from './logic/slides'

export type { DrawingsState } from './state/drawings'
export { drawingState, onDrawingUpdate } from './state/drawings'
export type { SharedState } from './state/shared'
export { onSharedUpdate, sharedState } from './state/shared'
export { lockShortcuts } from './state/storage'

export {
  addSyncMethod,
  createSyncState,
  disableBuiltinSync,
} from './state/syncState'
