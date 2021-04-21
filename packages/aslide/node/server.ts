import { createServer as createViteServer, InlineConfig, mergeConfig } from 'vite'
import { ViteAslidePlugin } from './plugins/preset'

export async function createServer(entry?: string, config: InlineConfig = {}) {
  return await createViteServer(
    mergeConfig(
      config,
      {
        plugins: [
          ViteAslidePlugin({
            entry,
          }),
        ],
      },
    ),
  )
}
