import { promises as fs } from 'fs'
import { resolve, join } from 'path'
import http from 'http'
import { build as viteBuild, InlineConfig, mergeConfig, ResolvedConfig } from 'vite'
import connect from 'connect'
import sirv from 'sirv'
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
  let config: ResolvedConfig = undefined!

  try {
    await viteBuild(
      mergeConfig(
        viteConfig,
        <InlineConfig>({
          plugins: [
            ViteSlidevPlugin(options, pluginOptions),
            {
              name: 'resolve-config',
              configResolved(_config) {
                config = _config
              },
            },
          ],
        }),
      ),
    )
  }
  finally {
    await fs.unlink(indexPath)
  }

  if (options.data.config.download === true || options.data.config.download === 'auto') {
    const { exportSlides } = await import('./export')

    const port = 12445
    const app = connect()
    const server = http.createServer(app)
    app.use(
      config.base,
      sirv(config.build.outDir, {
        etag: true,
        single: true,
      }),
    )
    server.listen(port)
    await exportSlides({
      port,
      total: options.data.slides.length,
      format: 'pdf',
      output: join(config.build.outDir, 'slidev-exported.pdf'),
      base: config.base,
    })
    server.close()
  }
}
