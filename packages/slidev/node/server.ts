import { createServer as createViteServer, InlineConfig, mergeConfig } from 'vite'
import { resolveOptions } from './plugins/options'
import { ViteSlidevPlugin } from './plugins/preset'

export async function createServer(entry?: string, config: InlineConfig = {}) {
  const options = await resolveOptions(entry)
  const server = await createViteServer(
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

  console.log('theme: ', options.theme)

  return server
}
