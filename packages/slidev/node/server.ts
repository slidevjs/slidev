import { join } from 'node:path'
import process from 'node:process'
import type { InlineConfig } from 'vite'
import { createServer as createViteServer, mergeConfig } from 'vite'
import { mergeViteConfigs } from './common'
import type { ResolvedSlidevOptions, SlidevServerOptions } from './options'
import { ViteSlidevPlugin } from './plugins/preset'
import { clientRoot, userRoot } from './resolver'

export async function createServer(
  options: ResolvedSlidevOptions,
  viteConfig: InlineConfig = {},
  serverOptions: SlidevServerOptions = {},
) {
  // default open editor to code, #312
  process.env.EDITOR = process.env.EDITOR || 'code'

  const config = await mergeViteConfigs(
    options,
    viteConfig,
    <InlineConfig>({
      root: userRoot,
      optimizeDeps: {
        entries: [
          join(clientRoot, 'main.ts'),
        ],
      },
    }),
    'serve',
  )

  const server = await createViteServer(
    mergeConfig(
      config,
      {
        plugins: [
          await ViteSlidevPlugin(options, config.slidev || {}, serverOptions),
        ],
        define: {
          // Fixes Vue production mode breaking PDF Export #1245
          __VUE_PROD_DEVTOOLS__: JSON.stringify(true),
        },
      },
    ),
  )

  return server
}
