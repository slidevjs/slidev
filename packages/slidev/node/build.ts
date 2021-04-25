import { promises as fs } from 'fs'
import { build as viteBuild, InlineConfig, mergeConfig } from 'vite'
import { ViteSlidevPlugin } from './plugins/preset'
import { getIndexHtml } from './common'
import { resolveOptions, SlidevEntryOptions, SlidevPluginOptions } from './plugins/options'

export async function build(
  entry: SlidevEntryOptions = {},
  pluginOptions: Omit<SlidevPluginOptions, 'slidev'> = {},
  viteConfig: InlineConfig = {},
) {
  const resolved = await resolveOptions(entry)
  await fs.writeFile('index.html', await getIndexHtml(resolved), 'utf-8')
  try {
    await viteBuild(
      mergeConfig(
        viteConfig,
        {
          plugins: [
            ViteSlidevPlugin({
              ...pluginOptions,
              slidev: resolved,
            }),
          ],
        },
      ),
    )
  }
  finally {
    await fs.unlink('index.html')
  }
}
