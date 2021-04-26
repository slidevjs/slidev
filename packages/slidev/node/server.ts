import { bold, cyan, dim, green, yellow } from 'kolorist'
import { createServer as createViteServer, InlineConfig, mergeConfig } from 'vite'
import { version } from '../package.json'
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
      {
        plugins: [
          ViteSlidevPlugin(options, pluginConfig),
        ],
      },
    ),
  )

  return server
}
