import { promises as fs } from 'fs'
import { build as viteBuild, InlineConfig, mergeConfig } from 'vite'
import { ViteSlidevPlugin } from './plugins/preset'
import { getIndexHtml } from './common'
import { ResolvedSlidevOptions, SlidevPluginOptions } from './plugins/options'

export async function build(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions = {},
  viteConfig: InlineConfig = {},
) {
  await fs.writeFile('index.html', await getIndexHtml(options), 'utf-8')
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
    await fs.unlink('index.html')
  }
}
