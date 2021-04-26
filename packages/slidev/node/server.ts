import { createServer as createViteServer, InlineConfig, mergeConfig } from 'vite'
import { ResolvedSlidevOptions, SlidevPluginOptions } from './plugins/options'
import { ViteSlidevPlugin } from './plugins/preset'

export async function createServer(
  options: ResolvedSlidevOptions,
  pluginConfig: SlidevPluginOptions = {},
  viteConfig: InlineConfig = {},
) {
  const server = await createViteServer(
    mergeConfig(
      viteConfig,
      <InlineConfig>({
        plugins: [
          ViteSlidevPlugin(options, pluginConfig),
        ],
        clearScreen: false,
        logLevel: 'warn',
      }),
    ),
  )

  return server
}
