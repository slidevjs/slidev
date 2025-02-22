// @ts-expect-error - virtual module
import serverSnapshotState from 'server-reactive:snapshots?diff'
import { createSyncState } from './syncState'

export type SnapshotState = Record<string, {
  revision: string
  image: string
}>

export const snapshotState = createSyncState<SnapshotState>(
  serverSnapshotState,
  serverSnapshotState,
  true,
)
