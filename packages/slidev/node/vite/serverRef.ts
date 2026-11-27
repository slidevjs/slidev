import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import ServerRef from 'vite-plugin-vue-server-ref'
import { loadDrawings, writeDrawings } from '../integrations/drawings'
import { loadSnapshots, writeSnapshots } from '../integrations/snapshots'

const serverRefStates = new WeakMap<ResolvedSlidevOptions, Record<string, any>>()

/**
 * Access the server-side state shared with the clients via
 * `vite-plugin-vue-server-ref` (e.g. `nav` holds the current position of the
 * live presentation).
 */
export function getServerRefState(options: ResolvedSlidevOptions): Record<string, any> | undefined {
  return serverRefStates.get(options)
}

export async function createServerRefPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
) {
  const state: Record<string, any> = {
    sync: false,
    nav: {
      page: 0,
      clicks: 0,
      timer: {
        status: 'stopped',
        slides: {},
        startedAt: 0,
        pausedAt: 0,
      },
    },
    drawings: await loadDrawings(options),
    snapshots: await loadSnapshots(options),
    ...pluginOptions.serverRef?.state,
  }
  serverRefStates.set(options, state)

  return ServerRef({
    debug: false, // process.env.NODE_ENV === 'development',
    state,
    onChanged(key, data, patch, timestamp) {
      pluginOptions.serverRef?.onChanged?.(key, data, patch, timestamp)

      if (options.data.config.drawings.persist && key === 'drawings')
        writeDrawings(options, patch ?? data)

      if (key === 'snapshots')
        writeSnapshots(options, data)
    },
  })
}
