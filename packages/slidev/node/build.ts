import { promises as fs } from 'fs'
import { build as viteBuild, InlineConfig, mergeConfig } from 'vite'
import { ViteSlidevPlugin } from './plugins/preset'
import { getIndexHtml } from './common'
import { resolveOptions } from './plugins/options'

export async function build(entry: string, config: InlineConfig = {}) {
  await fs.writeFile('index.html', await getIndexHtml(resolveOptions(entry)), 'utf-8')
  try {
    await viteBuild(
      mergeConfig(
        config,
        {
          plugins: [
            ViteSlidevPlugin({
              entry,
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
