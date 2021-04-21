import { promises as fs } from 'fs'
import { build as viteBuild, InlineConfig, mergeConfig } from 'vite'
import { ViteAslidePlugin } from './plugins/preset'
import { getIndexHtml } from './common'

export async function build(entry: string, config: InlineConfig = {}) {
  await fs.writeFile('index.html', await getIndexHtml(), 'utf-8')
  await viteBuild(
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
  await fs.unlink('index.html')
}
