import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import ServerRef from 'vite-plugin-vue-server-ref'
import { loadDrawings, writeDrawings } from '../integrations/drawings'
import { loadSnapshots, writeSnapshots } from '../integrations/snapshots'

export async function createServerRefPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
) {
  return ServerRef({
    debug: false, // process.env.NODE_ENV === 'development',
    state: {
      sync: false,
      nav: {
        page: 0,
        clicks: 0,
      },
      drawings: await loadDrawings(options),
      snapshots: await loadSnapshots(options),
      ...pluginOptions.serverRef?.state,
    },
    onChanged(key, data, patch, timestamp) {
      pluginOptions.serverRef?.onChanged?.(key, data, patch, timestamp)
      if (options.data.config.drawings.persist && key === 'drawings')
        writeDrawings(options, patch ?? data)

      if (key === 'snapshots')
        writeSnapshots(options, data)
    },
  })
}
