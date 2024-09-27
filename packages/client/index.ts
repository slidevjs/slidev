export { useDarkMode } from './composables/useDarkMode'
export { useDrawings } from './composables/useDrawings'
export { useNav } from './composables/useNav'
/**
 * This file is the public APIs that you might use in your app.
 *
 * The other files despite they are accessable, are not meant to be used directly, breaking changes might happen.
 */
export { useSlideContext } from './context'
export * from './env'

export { createSyncState, disableSlidevSync, addSyncMethod } from './state/syncState'
export { onDrawingUpdate, drawingState } from './state/drawings'
export { onSharedUpdate, sharedState } from './state/shared'
export type { DrawingsState } from './state/drawings'
export type { SharedState } from './state/shared'

export * from './layoutHelper'
export { onSlideEnter, onSlideLeave, useIsSlideActive } from './logic/slides'
