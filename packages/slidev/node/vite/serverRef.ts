import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import ServerRef from 'vite-plugin-vue-server-ref'
import { loadDrawings, writeDrawings } from '../integrations/drawings'

export async function createServerRefPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
) {
  const drawingData = await loadDrawings(options)

  return ServerRef({
    debug: false, // process.env.NODE_ENV === 'development',
    state: {
      sync: false,
      nav: {
        page: 0,
        clicks: 0,
      },
      drawings: drawingData,
      ...pluginOptions.serverRef?.state,
    },
    onChanged(key, data, patch, timestamp) {
      pluginOptions.serverRef?.onChanged?.(key, data, patch, timestamp)
      if (!options.data.config.drawings.persist)
        return
      if (key === 'drawings')
        writeDrawings(options, patch ?? data)
    },
  })
}
