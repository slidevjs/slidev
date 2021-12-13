import { join } from 'path'
import type { InlineConfig } from 'vite'
import { createServer as createViteServer, mergeConfig, resolveConfig } from 'vite'
import type { ResolvedSlidevOptions, SlidevServerOptions } from './options'
import { ViteSlidevPlugin } from './plugins/preset'

export async function createServer(
  options: ResolvedSlidevOptions,
  viteConfig: InlineConfig = {},
  serverOptions: SlidevServerOptions = {},
) {
  const rawConfig = await resolveConfig({}, 'serve')
  const pluginOptions = rawConfig.slidev || {}

  // default open editor to code, #312
  process.env.EDITOR = process.env.EDITOR || 'code'

  const server = await createViteServer(
    mergeConfig(
      viteConfig,
      <InlineConfig>({
        optimizeDeps: {
          entries: [
            join(options.clientRoot, 'main.ts'),
          ],
        },
        plugins: [
          await ViteSlidevPlugin(options, pluginOptions, serverOptions),
        ],
      }),
    ),
  )

  return server
}
