/**
 * This file is the public APIs that you might use in your app.
 *
 * The other files despite they are accessable, are not meant to be used directly, breaking changes might happen.
 */
export { useSlideContext } from './context'
export { useNav } from './composables/useNav'
export { useDrawings } from './composables/useDrawings'
export { useDarkMode } from './composables/useDarkMode'
export { useIsSlideActive, onSlideEnter, onSlideLeave } from './logic/slides'

export { createSyncState, disableSlidevSync, addSyncMethod } from './state/syncState'
export { onDrawingUpdate, drawingState } from './state/drawings'
export { onSharedUpdate, sharedState } from './state/shared'
export type { DrawingsState } from './state/drawings'
export type { SharedState } from './state/shared'

export * from './layoutHelper'
export * from './env'
