import { promises as fs } from 'fs'
import { resolve } from 'path'
import { build as viteBuild, InlineConfig, mergeConfig } from 'vite'
import { ViteSlidevPlugin } from './plugins/preset'
import { getIndexHtml } from './common'
import { ResolvedSlidevOptions, SlidevPluginOptions } from './plugins/options'

export async function build(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions = {},
  viteConfig: InlineConfig = {},
) {
  const indexPath = resolve(options.userRoot, 'index.html')
  await fs.writeFile(indexPath, await getIndexHtml(options), 'utf-8')
  try {
    await viteBuild(
      mergeConfig(
        viteConfig,
        <InlineConfig>({
          plugins: [
            ViteSlidevPlugin(options, pluginOptions),
          ],
        }),
      ),
    )
  }
  finally {
    await fs.unlink(indexPath)
  }
}
