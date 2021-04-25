import { promises as fs } from 'fs'
import { build as viteBuild, InlineConfig, mergeConfig } from 'vite'
import { ViteSlidevPlugin } from './plugins/preset'
import { getIndexHtml } from './common'
import { resolveOptions } from './plugins/options'

export async function build(entry: string, config: InlineConfig = {}) {
  const options = await resolveOptions(entry)
  await fs.writeFile('index.html', await getIndexHtml(options), 'utf-8')
  try {
    await viteBuild(
      mergeConfig(
        config,
        {
          plugins: [
            await ViteSlidevPlugin({
              resolved: options,
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
