import { bold, cyan, dim, green, yellow } from 'kolorist'
import { createServer as createViteServer, InlineConfig, mergeConfig } from 'vite'
import { version } from '../package.json'
import { resolveOptions, SlidevEntryOptions, SlidevPluginOptions } from './plugins/options'
import { ViteSlidevPlugin } from './plugins/preset'

export async function createServer(
  entry: SlidevEntryOptions,
  pluginConfig: Omit<SlidevPluginOptions, 'slidev'> = {},
  viteConfig: InlineConfig = {},
) {
  const resolved = await resolveOptions(entry)
  const server = await createViteServer(
    mergeConfig(
      viteConfig,
      {
        plugins: [
          ViteSlidevPlugin({
            ...pluginConfig,
            slidev: resolved,
          }),
        ],
      },
    ),
  )

  console.log()
  console.log(cyan(bold(' Slidev  ')) + yellow(`v${version}`))
  console.log()
  console.log(` theme   ${green(resolved.theme)}`)
  console.log(` entry   ${dim(resolved.entry)}`)
  console.log()

  return {
    server,
    resolved,
  }
}
